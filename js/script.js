var tplhb = {},
	router;

$(function() {
	initTemplates();
	initEvents();
	initRouter();
});

function initTemplates() {
	$('script[type="text/template"]').each(function() {
		tplhb[$(this).attr('id').replace(/^tpl-/, '')] = Handlebars.compile($(this).html());
	});
}

function initEvents() {
	$('#form-twitchcheck').submit(function(e) {
		e.preventDefault();
		var name = $('#twitchcheck-name').val(),
			follows = $('#twitchcheck-follows').val(),
			compare = $('#twitchcheck-compare').val();
		
		$('#twitchcheck-check').button('loading');
		$('div[id^="twitchcheck-info-"]').html('');
		checkAccount(name, follows)
			.then(function() {
				$('#twitchcheck-hr').removeClass('hidden');
			})
			.always(function() {
				$('#twitchcheck-check').button('reset');
			});
		if(compare.length) {
			checkAccount(compare, follows, true);
		}
		router.navigate('twitchcheck/' + name + (follows.length ? '/' + follows : '') + (compare.length ? (follows.length ? '' : '/-') + '/' + compare : ''));
	});
}

function initRouter() {
	var Router = Backbone.Router.extend({
		routes: {
			'twitchcheck/:name(/:follows)(/:compare)': 'twitchCheck',
			':tab': 'showTab'
		},
		
		showTab: function(tab) {
			$('#tab-' + tab).tab('show');
		},
		twitchCheck: function(name, follows, compare) {
			$('#tab-twitchcheck').tab('show');
			$('#twitchcheck-name').val(name);
			$('#twitchcheck-follows').val(follows == '-' ? '' : follows);
			$('#twitchcheck-compare').val(compare);
			$('#form-twitchcheck').submit();
		}
	});
	
	router = new Router();
	Backbone.history.start();
}

function checkAccount(name, follows, compare) {
	var clientId = '40w88knq1yh4uin839dqjg5lxuhxns9';
	return $.ajax({
		url: 'https://api.twitch.tv/kraken/users/' + name,
		headers: {
			'Client-ID': clientId
		},
		success: function(resp) {
			resp.created_at = new Date(resp.created_at).toLocaleString();
			resp.updated_at = new Date(resp.updated_at).toLocaleString();
			$('#twitchcheck-info-user' + (compare ? '2' : '')).html(tplhb.twitchcheckInfoUser(resp));
			if(follows.length && follows != '-') {
				var data = {
					name: resp.display_name,
					channel: follows,
				};
				$.ajax({
					url: 'https://api.twitch.tv/kraken/users/' + name + '/follows/channels/' + follows,
					headers: {
						'Client-ID': clientId
					},
					success: function(resp2) {
						data.created_at = new Date(resp2.created_at).toLocaleString();
					},
					complete: function() {
						$('#twitchcheck-info-follows' + (compare ? '2' : '')).html(tplhb.twitchcheckInfoFollows(data));
					}
				});
			}
		},
		error: function(resp) {
			alert(resp.responseJSON.message);
		}
	});
}