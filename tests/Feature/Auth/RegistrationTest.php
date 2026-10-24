<?php

test('public registration is disabled', function () {
    $this->get('/register')->assertNotFound();
});

test('registration cannot be posted', function () {
    $this->post('/register', [
        'name' => 'Outsider',
        'email' => 'outsider@lattice.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    $this->assertGuest();
});
