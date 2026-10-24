<?php

declare(strict_types=1);

namespace App\Cms\Sections;

use Illuminate\Contracts\Support\Arrayable;

/**
 * One editable value inside a section. The editor builds its inspector from
 * these definitions and never from a hand-written form.
 *
 * @implements Arrayable<string, mixed>
 */
final class Field implements Arrayable
{
    public const TYPES = [
        'text', 'textarea', 'richtext', 'number', 'boolean',
        'select', 'url', 'media', 'color', 'repeater',
    ];

    /**
     * @param  list<array{value: string, label: string}>  $options
     * @param  list<Field>  $fields  only for repeaters (one nesting level)
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $type = 'text',
        public readonly mixed $default = null,
        public readonly bool $required = false,
        public readonly array $rules = [],
        public readonly array $options = [],
        public readonly array $fields = [],
        public readonly ?string $hint = null,
    ) {
        if (! in_array($type, self::TYPES, true)) {
            throw new \InvalidArgumentException("Unknown field type [{$type}].");
        }
    }

    public static function text(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'text', $options['default'] ?? '', $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function textarea(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'textarea', $options['default'] ?? '', $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function richtext(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'richtext', $options['default'] ?? '', $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function number(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'number', $options['default'] ?? 0, $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function boolean(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'boolean', $options['default'] ?? false, $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function url(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'url', $options['default'] ?? '', $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function media(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'media', $options['default'] ?? null, $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    public static function color(string $key, string $label, array $options = []): self
    {
        return new self($key, $label, 'color', $options['default'] ?? '#000000', $options['required'] ?? false, $options['rules'] ?? [], [], [], $options['hint'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $options  plus `choices` => [value => label]
     */
    public static function select(string $key, string $label, array $options = []): self
    {
        $choices = [];

        foreach ((array) ($options['choices'] ?? []) as $value => $choiceLabel) {
            $choices[] = ['value' => (string) $value, 'label' => (string) $choiceLabel];
        }

        return new self($key, $label, 'select', $options['default'] ?? ($choices[0]['value'] ?? ''), $options['required'] ?? false, $options['rules'] ?? [], $choices, [], $options['hint'] ?? null);
    }

    /**
     * @param  list<Field>  $fields
     */
    public static function repeater(string $key, string $label, array $fields, array $options = []): self
    {
        return new self($key, $label, 'repeater', $options['default'] ?? [], $options['required'] ?? false, $options['rules'] ?? [], [], $fields, $options['hint'] ?? null);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type,
            'default' => $this->default,
            'required' => $this->required,
            'rules' => $this->rules,
            'options' => $this->options,
            'fields' => array_map(fn (Field $field): array => $field->toArray(), $this->fields),
            'hint' => $this->hint,
        ];
    }
}
