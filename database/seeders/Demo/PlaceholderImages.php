<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use GdImage;
use RuntimeException;

/**
 * The demo library's images, drawn with GD.
 *
 * No binary fixtures in the repository and no stock photography: each image is
 * a duotone abstract built from its seed, so the same seed always produces the
 * same picture and the demo looks designed rather than random.
 */
final class PlaceholderImages
{
    /** @var list<array{0: string, 1: string, 2: string}> */
    private const PALETTES = [
        ['#1e1b4b', '#6366f1', '#c7d2fe'],
        ['#0f172a', '#0ea5e9', '#bae6fd'],
        ['#3b0764', '#a855f7', '#e9d5ff'],
        ['#14532d', '#22c55e', '#bbf7d0'],
        ['#7c2d12', '#f97316', '#fed7aa'],
        ['#334155', '#94a3b8', '#e2e8f0'],
        ['#4c0519', '#e11d48', '#fecdd3'],
        ['#312e81', '#818cf8', '#e0e7ff'],
    ];

    /**
     * @return string absolute path to a temporary JPEG
     */
    public function make(string $seed, int $width = 1600, int $height = 1067): string
    {
        if (! function_exists('imagecreatetruecolor')) {
            throw new RuntimeException('The GD extension is required to generate demo images.');
        }

        $index = crc32($seed) % count(self::PALETTES);
        [$dark, $mid, $light] = array_map([$this, 'rgb'], self::PALETTES[$index]);

        $image = imagecreatetruecolor($width, $height);

        if (! $image instanceof GdImage) {
            throw new RuntimeException('Could not allocate the demo image.');
        }

        $this->gradient($image, $width, $height, $dark, $mid);
        $this->shapes($image, $width, $height, $light, crc32($seed));
        $this->grain($image, $width, $height);

        $path = tempnam(sys_get_temp_dir(), 'lattice-demo-').'.jpg';

        imagejpeg($image, $path, 88);
        imagedestroy($image);

        return $path;
    }

    /**
     * @param  array{0: int, 1: int, 2: int}  $from
     * @param  array{0: int, 1: int, 2: int}  $to
     */
    private function gradient(GdImage $image, int $width, int $height, array $from, array $to): void
    {
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / max(1, $height - 1);
            $colour = imagecolorallocate(
                $image,
                (int) round($from[0] + ($to[0] - $from[0]) * $ratio),
                (int) round($from[1] + ($to[1] - $from[1]) * $ratio),
                (int) round($from[2] + ($to[2] - $from[2]) * $ratio),
            );

            imageline($image, 0, $y, $width, $y, $colour);
        }
    }

    /**
     * A few translucent discs and one hard edge — enough structure that the
     * image reads as a designed composition at thumbnail size.
     *
     * @param  array{0: int, 1: int, 2: int}  $tint
     */
    private function shapes(GdImage $image, int $width, int $height, array $tint, int $seed): void
    {
        mt_srand($seed);
        $soft = imagecolorallocatealpha($image, $tint[0], $tint[1], $tint[2], 96);
        $solid = imagecolorallocatealpha($image, $tint[0], $tint[1], $tint[2], 32);

        for ($i = 0; $i < 4; $i++) {
            $radius = (int) mt_rand((int) ($width * 0.12), (int) ($width * 0.34));
            $cx = mt_rand(0, $width);
            $cy = mt_rand(0, $height);

            imagefilledellipse($image, $cx, $cy, $radius * 2, $radius * 2, $i % 2 === 0 ? $soft : $solid);
        }

        $band = (int) ($height * 0.62);
        imagefilledrectangle($image, 0, $band, (int) ($width * 0.42), $height, $solid);
        imagefilledrectangle($image, (int) ($width * 0.55), 0, $width, (int) ($height * 0.12), $soft);
    }

    private function grain(GdImage $image, int $width, int $height): void
    {
        mt_srand(7);

        for ($i = 0; $i < 900; $i++) {
            $x = mt_rand(0, $width - 1);
            $y = mt_rand(0, $height - 1);
            $alpha = mt_rand(96, 120);
            $dot = imagecolorallocatealpha($image, 255, 255, 255, $alpha);

            imagefilledrectangle($image, $x, $y, $x + 1, $y + 1, $dot);
        }
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    private function rgb(string $hex): array
    {
        $hex = ltrim($hex, '#');

        return [
            (int) hexdec(substr($hex, 0, 2)),
            (int) hexdec(substr($hex, 2, 2)),
            (int) hexdec(substr($hex, 4, 2)),
        ];
    }
}
