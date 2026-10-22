<?php

namespace App\Features\Cms\Models;

use App\Features\Cms\Factories\CtaFactory;
use App\Models\Concerns\BelongsToSite;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A reusable call to action. Blocks on pages, posts and the landing page refer to it by id, so an edit here
 * changes every place it is used.
 *
 * @property int $id
 * @property string $name
 * @property string $heading
 * @property string|null $text
 * @property string|null $button_label
 * @property string|null $button_url
 */
class Cta extends Model
{
    use BelongsToSite;
    use HasFactory;

    protected $table = 'cms_ctas';

    protected $fillable = [
        'name',
        'heading',
        'text',
        'button_label',
        'button_url',
    ];

    protected static function newFactory(): CtaFactory
    {
        return CtaFactory::new();
    }
}
