<?php

namespace App\Cms\Sections;

use Illuminate\Contracts\Support\Arrayable;

/**
 * A block of content a theme can render. PHP is the source of truth: the
 * editor, the inspector and the validation rules are all derived from here and
 * exported to TypeScript by `lattice:discover`.
 *
 * @implements Arrayable<string, mixed>
 */
final class Section implements Arrayable
{
    /**
     * @param  list<Field>  $fields
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $description = '',
        public readonly string $icon = 'layout-grid',
        public readonly array $fields = [],
        public readonly ?string $theme = null,
    ) {}

    /**
     * @param  list<Field>  $fields
     */
    public static function make(string $key, string $label, array $fields, array $options = []): self
    {
        return new self(
            key: $key,
            label: $label,
            description: (string) ($options['description'] ?? ''),
            icon: (string) ($options['icon'] ?? 'layout-grid'),
            fields: $fields,
            theme: $options['theme'] ?? null,
        );
    }

    /**
     * A fresh block of content with every default applied.
     *
     * @return array{id: string, section: string, enabled: bool, content: array<string, mixed>}
     */
    public function blank(string $id): array
    {
        return [
            'id' => $id,
            'section' => $this->key,
            'enabled' => true,
            'content' => $this->defaults(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        $content = [];

        foreach ($this->fields as $field) {
            $content[$field->key] = $field->type === 'repeater' ? [] : $field->default;
        }

        return $content;
    }

    /**
     * Validation rules for a block's content, derived from the field types.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [];

        foreach ($this->fields as $field) {
            $rules["content.{$field->key}"] = $field->required
                ? ['required', ...$field->rules]
                : ['nullable', ...$field->rules];
        }

        return $rules;
    }

    /**
     * Human labels for the fields, used by the editor's error messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [];

        foreach ($this->fields as $field) {
            $attributes["content.{$field->key}"] = $field->label;
        }

        return $attributes;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'theme' => $this->theme,
            'defaults' => $this->defaults(),
            'fields' => array_map(fn (Field $field): array => $field->toArray(), $this->fields),
        ];
    }
}
