<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A flat folder tree over the media library. Folders carry no files on disk —
 * the path of a media item never changes when it is moved.
 *
 * @property int $id
 * @property int|null $parent_id
 * @property string $name
 * @property string $slug
 * @property Carbon|null $created_at
 */
class MediaFolder extends Model
{
    protected $fillable = ['parent_id', 'name', 'slug'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'folder_id');
    }

    /**
     * Breadcrumb from the root folder down to this one.
     *
     * @return list<string>
     */
    public function trail(): array
    {
        $trail = [$this->name];
        $folder = $this->parent;

        while ($folder !== null) {
            array_unshift($trail, $folder->name);
            $folder = $folder->parent;
        }

        return $trail;
    }

    public function depth(): int
    {
        return count($this->trail()) - 1;
    }

    public static function slugFor(string $name, ?int $parentId, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'folder';
        $slug = $base;
        $suffix = 2;

        while (self::query()
            ->where('parent_id', $parentId)
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
