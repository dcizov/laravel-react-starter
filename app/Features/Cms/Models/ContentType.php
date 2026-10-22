<?php

namespace App\Features\Cms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Features\Cms\Support\SafeUrl;
use Illuminate\Validation\Rule;

/**
 * A kind of content: pages, blog posts, or a custom post type an admin defines.
 *
 * @property int $id
 * @property string $key
 * @property string $label
 * @property string $singular_label
 * @property bool $has_archive
 * @property list<string> $supports
 * @property list<array{key: string, label: string, type: string}> $fields
 * @property bool $builtin
 */
class ContentType extends Model
{
    public const SUPPORT_EXCERPT = 'excerpt';

    public const SUPPORT_IMAGE = 'image';

    public const SUPPORT_CATEGORY = 'category';

    public const SUPPORT_TAG = 'tag';

    public const SUPPORT_COMMENTS = 'comments';

    /**
     * What a content type can use. Comments are open to visitors on entries of a type that has them.
     *
     * @var list<string>
     */
    public const SUPPORTS = [
        self::SUPPORT_EXCERPT,
        self::SUPPORT_IMAGE,
        self::SUPPORT_CATEGORY,
        self::SUPPORT_TAG,
        self::SUPPORT_COMMENTS,
    ];

    /**
     * The types of custom field an admin can add.
     *
     * @var list<string>
     */
    public const FIELD_TYPES = ['text', 'textarea', 'url', 'number', 'date', 'boolean'];

    protected $table = 'cms_content_types';

    protected $fillable = [
        'key',
        'label',
        'singular_label',
        'has_archive',
        'supports',
        'fields',
        'builtin',
    ];

    protected function casts(): array
    {
        return [
            'has_archive' => 'boolean',
            'supports' => 'array',
            'fields' => 'array',
            'builtin' => 'boolean',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(ContentEntry::class, 'content_type', 'key');
    }

    public function supports(string $feature): bool
    {
        return in_array($feature, $this->supports ?? [], true);
    }

    /**
     * Validation rules for the custom field values an entry of this type can have.
     *
     * @return array<string, array<int, mixed>>
     */
    public function customFieldRules(): array
    {
        $rules = [];

        foreach ($this->fields ?? [] as $field) {
            $rules['custom_fields.'.$field['key']] = match ($field['type']) {
                'textarea' => ['nullable', 'string', 'max:5000'],
                'url' => ['nullable', 'string', 'max:500', SafeUrl::rule()],
                'number' => ['nullable', 'numeric'],
                'date' => ['nullable', 'date'],
                'boolean' => ['nullable', 'boolean'],
                default => ['nullable', 'string', 'max:500'],
            };
        }

        return $rules;
    }

    public static function keyRules(?int $ignoreId = null): array
    {
        $unique = Rule::unique('cms_content_types', 'key');

        if ($ignoreId !== null) {
            $unique->ignore($ignoreId);
        }

        // These are used by the public URLs (/pages, /content, /blog) and the admin, so a type cannot take them.
        return ['required', 'string', 'regex:/^[a-z][a-z0-9-]{1,39}$/', 'not_in:admin,blog,content,pages', $unique];
    }

    public static function findByKey(string $key): ?self
    {
        return static::query()->where('key', $key)->first();
    }
}
