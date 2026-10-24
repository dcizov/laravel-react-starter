<?php

namespace App\Cms\Sections;

/**
 * The base set of sections every theme can render.
 */
final class CoreSections
{
    /**
     * @return list<Section>
     */
    public static function all(): array
    {
        return [
            self::hero(),
            self::richText(),
            self::featureGrid(),
            self::cta(),
        ];
    }

    public static function hero(): Section
    {
        return Section::make('hero', 'Hero', [
            Field::text('eyebrow', 'Eyebrow', ['hint' => 'A short line above the headline.']),
            Field::text('heading', 'Heading', ['required' => true, 'rules' => ['string', 'max:120']]),
            Field::textarea('body', 'Body', ['rules' => ['string', 'max:400']]),
            Field::select('align', 'Alignment', [
                'choices' => ['left' => 'Left', 'center' => 'Centre'],
                'default' => 'center',
            ]),
            Field::text('cta_label', 'Button label', ['rules' => ['string', 'max:40']]),
            Field::url('cta_url', 'Button link', ['rules' => ['string', 'max:255']]),
            Field::media('image', 'Background image'),
        ], [
            'description' => 'The first thing a visitor sees.',
            'icon' => 'layout-template',
        ]);
    }

    public static function richText(): Section
    {
        return Section::make('rich-text', 'Rich text', [
            Field::text('heading', 'Heading', ['rules' => ['string', 'max:120']]),
            Field::richtext('body', 'Body', ['required' => true, 'rules' => ['string', 'max:20000']]),
            Field::select('width', 'Width', [
                'choices' => ['narrow' => 'Narrow', 'wide' => 'Wide'],
                'default' => 'narrow',
            ]),
        ], [
            'description' => 'Prose with headings, lists and links.',
            'icon' => 'text',
        ]);
    }

    public static function featureGrid(): Section
    {
        return Section::make('feature-grid', 'Feature grid', [
            Field::text('heading', 'Heading', ['rules' => ['string', 'max:120']]),
            Field::textarea('intro', 'Intro', ['rules' => ['string', 'max:400']]),
            Field::repeater('features', 'Features', [
                Field::text('title', 'Title', ['required' => true, 'rules' => ['string', 'max:80']]),
                Field::textarea('body', 'Body', ['rules' => ['string', 'max:300']]),
                Field::select('icon', 'Icon', [
                    'choices' => [
                        'sparkles' => 'Sparkles',
                        'layers' => 'Layers',
                        'zap' => 'Bolt',
                        'shield' => 'Shield',
                    ],
                    'default' => 'sparkles',
                ]),
            ], ['default' => []]),
        ], [
            'description' => 'Two to six short value propositions.',
            'icon' => 'layout-grid',
        ]);
    }

    public static function cta(): Section
    {
        return Section::make('cta', 'Call to action', [
            Field::text('heading', 'Heading', ['required' => true, 'rules' => ['string', 'max:120']]),
            Field::textarea('body', 'Body', ['rules' => ['string', 'max:300']]),
            Field::text('button_label', 'Button label', ['rules' => ['string', 'max:40']]),
            Field::url('button_url', 'Button link', ['rules' => ['string', 'max:255']]),
            Field::color('accent', 'Accent', ['default' => 'oklch(0.51 0.19 264)']),
        ], [
            'description' => 'A closing band with one action.',
            'icon' => 'megaphone',
        ]);
    }
}
