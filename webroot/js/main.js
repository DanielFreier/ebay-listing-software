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
    
    jquerydump:     '/js/jquery.dump',
    redactor:       '/js/redactor/redactor.min',
    bootstrap:      '/ace/assets/js/bootstrap.min',
    bootstraptag:   '/ace/assets/js/bootstrap-tag.min',
    bootstraptagta: '/ace/assets/js/typeahead-bs2.min',
    bootstrapwysiwyg: '/ace/assets/js/bootstrap-wysiwyg.min',
    bootstrapdatepicker: '/ace/assets/js/date-time/bootstrap-datepicker.min',
    ace:            '/ace/assets/js/uncompressed/ace',
    aceelements:    '/ace/assets/js/uncompressed/ace-elements',
    events:         '/js/events'
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
    bootstrapdatepicker: {
      deps: ['jquery']
    },
    jquerydump: {
      deps: ['jquery']
    },
    bootstrap: {
      deps: ['jquery']
    },
    bootstrapwysiwyg: {
      deps: ['jquery']
    },
    bootstraptag: {
      deps: ['jquery', 'bootstraptagta']
    },
    bootstraptagta: {
      deps: ['jquery']
    },
    aceelements: {
      deps: ['jquery']
    },
    events: {
      deps: ['backbone']
    },
    ace: {
      deps: ['jquery', 'aceelements', 'bootstrap', 'bootstrapwysiwyg',
             'bootstrapdatepicker', 'bootstraptag', 'bootstraptagta',
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
