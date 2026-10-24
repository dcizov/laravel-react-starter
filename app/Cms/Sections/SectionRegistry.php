<?php

namespace App\Cms\Sections;

use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use Illuminate\Support\Facades\Validator as ValidatorFactory;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

/**
 * Every section a theme can render: the core set is always available, an
 * installed theme or addon may add its own. The active theme's registry is the
 * source of truth at render time.
 */
final class SectionRegistry
{
    /** @var array<string, Section> */
    private array $sections = [];

    private bool $loaded = false;

    public function __construct(
        private readonly AddonRepository $addons,
        private readonly ThemeRepository $themes,
    ) {}

    /**
     * @return array<string, Section>
     */
    public function all(): array
    {
        $this->load();

        return $this->sections;
    }

    /**
     * @return list<Section>
     */
    public function list(): array
    {
        return array_values($this->all());
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->all());
    }

    public function find(string $key): ?Section
    {
        return $this->all()[$key] ?? null;
    }

    /**
     * Register a section. Themes and addons call this from their provider,
     * which runs before anything asks for the list, so this must not mark the
     * registry as loaded — the core set still has to be merged in afterwards.
     */
    public function add(Section $section): void
    {
        $this->sections[$section->key] = $section;
    }

    /**
     * @param  list<Section>  $sections
     */
    public function addMany(array $sections): void
    {
        foreach ($sections as $section) {
            $this->add($section);
        }
    }

    /**
     * A blank page: one hero, nothing else.
     *
     * @return list<array<string, mixed>>
     */
    public function blankPage(): array
    {
        $hero = $this->find('hero');

        return $hero === null ? [] : [$hero->blank((string) Str::uuid())];
    }

    /**
     * Normalise arbitrary page content: drop unknown sections, fill in missing
     * keys with defaults, and keep the order the client sent.
     *
     * @return list<array<string, mixed>>
     */
    public function normalize(mixed $content): array
    {
        if (! is_array($content)) {
            return [];
        }

        $normalized = [];

        foreach ($content as $block) {
            if (! is_array($block)) {
                continue;
            }

            $key = $block['section'] ?? null;
            $section = is_string($key) ? $this->find($key) : null;

            if ($section === null) {
                continue;
            }

            $values = is_array($block['content'] ?? null) ? $block['content'] : [];

            $normalized[] = [
                'id' => is_string($block['id'] ?? null) && $block['id'] !== ''
                    ? $block['id']
                    : (string) Str::uuid(),
                'section' => $section->key,
                'enabled' => (bool) ($block['enabled'] ?? true),
                'content' => array_replace($section->defaults(), $values),
            ];
        }

        return $normalized;
    }

    /**
     * Structural rules for the content tree. Section-specific field rules are
     * applied after normalisation by `validate()` so that blocks of an unknown
     * section are dropped instead of rejected.
     *
     * @return array{rules: array<string, mixed>, attributes: array<string, string>}
     */
    public function rules(): array
    {
        return [
            'rules' => [
                'content' => ['sometimes', 'array', 'max:40'],
                'content.*.id' => ['required', 'string', 'max:64'],
                'content.*.section' => ['required', 'string', 'max:64'],
                'content.*.enabled' => ['boolean'],
                'content.*.content' => ['array'],
            ],
            'attributes' => [
                'content' => 'content',
            ],
        ];
    }

    /**
     * Validate each block's fields against its own section definition. Runs
     * after normalisation, so defaults are in place and unknown sections are
     * already gone.
     */
    public function validate(Validator $validator, mixed $content): void
    {
        foreach ($this->normalize($content) as $index => $block) {
            $section = $this->find((string) $block['section']);

            if ($section === null) {
                continue;
            }

            $rules = [];
            $attributes = [];

            foreach ($section->rules() as $path => $rule) {
                $rules[Str::after($path, 'content.')] = $rule;
            }

            foreach ($section->attributes() as $path => $label) {
                $attributes[Str::after($path, 'content.')] = $label;
            }

            $check = ValidatorFactory::make($block['content'], $rules, [], $attributes);

            foreach ($check->errors()->messages() as $field => $messages) {
                foreach ($messages as $message) {
                    $validator->errors()->add("content.{$index}.content.{$field}", $message);
                }
            }
        }
    }

    private function load(): void
    {
        if ($this->loaded) {
            return;
        }

        $this->loaded = true;

        $this->addMany(CoreSections::all());

        foreach ($this->addons->activeManifests() as $manifest) {
            foreach ($manifest->sections as $section) {
                if (is_array($section) && class_exists((string) ($section['class'] ?? ''))) {
                    $built = (string) $section['class'];

                    if (method_exists($built, 'make')) {
                        $this->add($built::make());
                    }
                }
            }
        }
    }
}
