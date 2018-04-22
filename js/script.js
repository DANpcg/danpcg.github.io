'use strict';

var tplhb = {},
  router,
  twitchcheckSuspiciousonlyWarning = false;

function checkAccount(name, follows, compare) {
  var clientId = '40w88knq1yh4uin839dqjg5lxuhxns9';
  return $.ajax({
    url: 'https://api.twitch.tv/kraken/users/' + name,
    headers: {
      'Client-ID': clientId,
    },
    success: function(resp) {
      $('#twitchchecklite-info-user' + (compare ? '2' : '')).html(
        tplhb.twitchcheckliteInfoUser(resp)
      );
      if (follows.length && follows !== '-') {
        var data = {
          name: resp.display_name,
          channel: follows,
        };
        $.ajax({
          url:
            'https://api.twitch.tv/kraken/users/' +
            name +
            '/follows/channels/' +
            follows,
          headers: {
            'Client-ID': clientId,
          },
          success: function(resp2) {
            data.created_at = resp2.created_at;
          },
          complete: function() {
            $('#twitchchecklite-info-follows' + (compare ? '2' : '')).html(
              tplhb.twitchcheckliteInfoFollows(data)
            );
          },
        });
      }
    },
    error: function(resp) {
      window.alert(resp.responseJSON.message);
    },
  });
}

function renderFollowers(header, followers) {
  var total = followers.length;
  twitchcheckSuspiciousonlyWarning = total < 9001;
  $('#twitchcheck-menu').removeAttr('hidden');
  $('#twitchcheck-suspiciousonly').prop('checked', false);
  $('#twitchcheck-total').text(total);
  $('#twitchcheck-suspicious').text(
    total - _.where(followers, { suspicious: false }).length
  );
  $('#twitchcheck-table').html(
    tplhb.twitchcheckTable({
      header: header,
      followers: followers,
    })
  );
}

function initTemplates() {
  $('script.handlebars').each(function() {
    tplhb[
      $(this)
        .attr('id')
        .replace(/^tpl-/, '')
    ] = Handlebars.compile($(this).html());
  });
  Handlebars.registerHelper('_formatDate', function(date) {
    return typeof date === 'string'
      ? new Date(date).toLocaleString()
      : date.toLocaleString();
  });
}

function initEvents() {
  $('#form-twitchchecklite').submit(function(e) {
    e.preventDefault();
    var name = $('#twitchchecklite-name')
        .val()
        .trim(),
      follows = $('#twitchchecklite-follows')
        .val()
        .trim(),
      compare = $('#twitchchecklite-compare')
        .val()
        .trim();

    $('#twitchchecklite-check').text(
      $('#twitchchecklite-check').data('text-loading')
    );
    $('div[id^="twitchchecklite-info-"]').html('');
    checkAccount(name, follows)
      .then(function() {
        $('#twitchchecklite-hr').removeAttr('hidden');
      })
      .always(function() {
        $('#twitchchecklite-check').text(
          $('#twitchchecklite-check').data('text-original')
        );
      });
    if (compare.length) {
      checkAccount(compare, follows, true);
    }
    router.navigate(
      'twitchchecklite/' +
        name +
        (follows.length ? '/' + follows : '') +
        (compare.length ? (follows.length ? '' : '/-') + '/' + compare : '')
    );
  });

  $('#form-twitchcheck').submit(function(e) {
    e.preventDefault();
    var file = $('#twitchcheck-csv').get(0).files[0],
      fr;

    if (file) {
      fr = new FileReader();
      fr.onload = function() {
        var arr = _.initial(fr.result.split('\n')),
          header,
          followers = [],
          red = 10 * 60000,
          yellow = 60 * 60000,
          threshold = new Date('2015-05-21T00:00:00Z');
        if (
          arr[0] ===
          '"Channel", "Follow Date", "Notfications", "User Created", "User Updated"'
        ) {
          _.each(arr, function(line, i) {
            var larr = line.replace(/^"(.+)"$/, '$1').split('", "');
            if (i < 1) {
              header = {
                name: larr[0],
                follow: larr[1],
                notify: larr[2],
                created: larr[3],
                updated: larr[4],
              };
            } else {
              var follower = {
                  name: larr[0],
                  follow: new Date(larr[1]),
                  notify: larr[2] === 'Yes',
                  created: new Date(larr[3]),
                  updated: new Date(larr[4]),
                },
                diff = follower.follow - follower.created;

              follower.suspicious =
                follower.follow > threshold
                  ? diff < red ? 'danger' : diff < yellow ? 'warning' : false
                  : false;
              follower.suspicion = follower.suspicious
                ? '<i class="fa fa-clock-o"></i> ' +
                  (diff > 60000 ? Math.floor(diff / 60000) : '<1') +
                  'm'
                : '';

              followers[i - 1] = follower;
            }
          });

          renderFollowers(header, followers);
        } else {
          window.alert('Please select a compatible csv file.');
        }
      };
      fr.readAsText(file);
    } else {
      window.alert('Please select a csv file.');
    }
  });
  $('#twitchcheck-suspiciousonly').on('change', function() {
    var check = !$(this).prop('checked');
    if (
      twitchcheckSuspiciousonlyWarning ||
      window.confirm(
        'The total number of followers is over 9000!\nThis operation might take a while. Continue?'
      )
    ) {
      twitchcheckSuspiciousonlyWarning = true;
      $('#twitchcheck-table tbody tr.ns').toggle(check);
    } else {
      $(this).prop('checked', check);
    }
  });
}

function initRouter() {
  var Router = Backbone.Router.extend({
    routes: {
      'twitchchecklite/:name(/:follows)(/:compare)': 'twitchCheckLite',
      ':tab': 'showTab',
    },

    showTab: function(tab) {
      $('#tab-' + tab).tab('show');
    },
    twitchCheckLite: function(name, follows, compare) {
      $('#tab-twitchchecklite').tab('show');
      $('#twitchchecklite-name').val(name);
      $('#twitchchecklite-follows').val(follows === '-' ? '' : follows);
      $('#twitchchecklite-compare').val(compare);
      $('#form-twitchchecklite').submit();
    },
  });

  router = new Router();
  Backbone.history.start();
}

$(function() {
  initTemplates();
  initEvents();
  initRouter();
});
