<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\Locales;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class LanguageController extends Controller
{
    /**
     * Change only the language, from the top bar. Other account settings stay as they are.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(Locales::codes())],
        ]);

        $request->user()->update(['locale' => $validated['locale']]);

        return back();
    }

    /**
     * Change the language as a guest, from the public page. The choice is kept in the session.
     */
    public function guest(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(Locales::codes())],
        ]);

        $request->session()->put('locale', $validated['locale']);

        return back();
    }
}
