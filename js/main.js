---
---

$('.hamburger').click(function() {
    $(this).toggleClass('is-active');
});

var $menu = $('#smgi-menu').mmenu(
    {
        extensions: [
        'border-full',
        'effect-menu-fade',
        'pagedim-black',
        'shadow-page',
        'theme-dark',
        'position-right',
        ],
        navbars: [
            {
            'position': 'top'
            }
        ]
        // options
    }
);

var $icon = $('.mmenu-button');
var API = $menu.data('mmenu');

$icon.on('click', function() {
API.open();
API.close();
});

API.bind('open:start', function() {
$icon.addClass('is-active');
});

API.bind('close:start', function() {
$icon.removeClass('is-active');
});
