<?php

test('guests are directed from home to the login page', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});
