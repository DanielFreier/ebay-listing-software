require.config({
  paths: {
    jquery:         '/js/jquery-1.11.0.min',
    underscore:     '/js/underscoreTplSettings',
    underscoreBase: '/js/underscore',
    backbone:       '/js/backbone-min',
    
    jquerymobile:     '/ace/assets/js/jquery.mobile.custom.min',
    jqueryui:         '/ace/assets/js/jquery-ui-1.10.3.custom.min',
    jquerycolorbox:   '/ace/assets/js/jquery.colorbox-min',
    jqueryslimscroll: '/ace/assets/js/jquery.slimscroll.min',
    
    jquerydump:   '/js/jquery.dump',
    redactor:     '/js/redactor/redactor.min',
    bootstrap:    '/ace/assets/js/bootstrap.min',
    bstag:        '/ace/assets/js/bootstrap-tag.min',
    bstagta:      '/ace/assets/js/typeahead-bs2.min',
    bswysiwyg:    '/ace/assets/js/bootstrap-wysiwyg.min',
    bsdatepicker: '/ace/assets/js/date-time/bootstrap-datepicker.min',
    bstimepicker: '/ace/assets/js/date-time/bootstrap-timepicker.min',
    ace:          '/ace/assets/js/uncompressed/ace',
    aceelements:  '/ace/assets/js/uncompressed/ace-elements',
    events:       '/js/events'
  },
  shim: {
    underscoreBase: {
      exports: '_'
    },
    underscore: {
      deps: ['underscoreBase'],
      exports: '_'
    },
    backbone: {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    jqueryui: {
      deps: ['jquery']
    },
    jquerycolorbox: {
      deps: ['jquery']
    },
    jqueryslimscroll: {
      deps: ['jquery']
    },
    /*
    jquerytimepicker: {
      deps: ['jquery', 'jqueryui']
    },
    */
    bsdatepicker: {
      deps: ['jquery']
    },
    bstimepicker: {
      deps: ['jquery']
    },
    /*
    bsdatetimepicker: {
      deps: ['jquery']
    },
    */
    jquerydump: {
      deps: ['jquery']
    },
    bootstrap: {
      deps: ['jquery']
    },
    bswysiwyg: {
      deps: ['jquery']
    },
    bstag: {
      deps: ['jquery', 'bstagta']
    },
    bstagta: {
      deps: ['jquery']
    },
    aceelements: {
      deps: ['jquery']
    },
    events: {
      deps: ['backbone']
    },
    ace: {
      deps: ['jquery', 'aceelements', 'bootstrap', 'bswysiwyg',
             'bsdatepicker', 'bstimepicker',
             'bstag', 'bstagta',
             'jquerycolorbox', 'jquerydump', 'jqueryui', 'jqueryslimscroll']
    }
  }    
});

require([
  'app',
  'ace'
], function(App) {
  App.initialize();
});
