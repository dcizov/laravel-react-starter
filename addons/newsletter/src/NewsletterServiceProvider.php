<?php

namespace Addons\Newsletter;

use Illuminate\Support\ServiceProvider;

/**
 * The newsletter addon's service provider. The addon lifecycle loads its routes and runs its migrations, so this
 * provider only exists to give the addon a place for bindings and listeners.
 */
class NewsletterServiceProvider extends ServiceProvider {}
