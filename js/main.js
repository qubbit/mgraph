$(function() {

	var cache = new LastFMCache();

	var lastfm = new LastFM({
		apiKey: '98a63757c7bd350beb8ff827d9274442',
		apiSecret: 'b0a36db98a0f4ecdf6914bcfd6cd5660',
		cache: cache
	});

	var hash = location.hash;

	if (hash) {
		loadSimilarArtist(decodeURIComponent(hash.substring(1)));
	}

	$("body").on("keypress", function(e) {
		if (!$("#artist").is(":focus") && e.keyCode === 32) {
			$("#input-control").toggle().find("input").focus();
		}
	});

	$("#artist").on("keypress", function(e) {

		var artistName = $(this).val();

		if (artistName && e.keyCode == 13) {
			loadSimilarArtist(artistName);
		}

	});

	function loadSimilarArtist(artistName) {


		lastfm.artist.getInfo({
			artist: artistName
		}, {
			success: function(artistInfo) {

				lastfm.artist.getSimilar({
					artist: artistName
				}, {
					success: function(data) {
						$("svg").remove();
						location.hash = encodeURIComponent(artistName);
						renderGraph(artistInfo, data);
					},
					error: function(code, message) {
						$("#no-artist").fadeIn().text(message);
					}
				});
			},
			error: function(code, message) {
				$("#no-artist").fadeIn().text(message);
			}
		});
	}


	var dragNode = d3.behavior.drag().on('dragstart', function(e) {
		console.log('started dragging node');
	})

	function renderGraph(artistInfo, data) {

		var width = window.innerWidth,
			height = window.innerHeight;


		var graph = {
			nodes: [{
				name: artistInfo.artist.name,
				image: artistInfo.artist.image[2]["#text"],
				group: -1
			}],
			links: []
		};

		_.map(_.take(data.similarartists.artist, 20), function(artist, index) {
			graph.nodes.push({
				name: artist.name,
				image: artist.image[2]["#text"],
				group: index
			});

			graph.links.push({
				source: 0,
				target: index,
				value: artist.match
			});
		});


		var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height);

		var force = d3.layout.force()
			.gravity(0)
			.distance(height / 2)
			.charge(-100)
			.size([width, height]);


		force
			.nodes(graph.nodes)
			.links(graph.links)
			.start();

		var link = svg.selectAll(".link")
			.data(graph.links)
			.enter().append("line")
			.attr("class", "link");

		var node = svg.selectAll(".node")
			.data(graph.nodes)
			.enter().append("g")
			.attr("class", "node")
			.call(force.drag)
			.on("click", function(d) {
				if (d3.event.defaultPrevented) return;
				loadSimilarArtist(d.name);
			});

		node.append("image")
			.attr("xlink:href", function(d) {
				return d.image;
			})
			.attr("x", -8)
			.attr("y", -8)
			.attr("width", 64)
			.attr("height", 64);

		node.append("text")
			.attr("dx", 64)
			.attr("dy", 32)
			.text(function(d) {
				return d.name
			});

		force.on("tick", function() {
			link.attr("x1", function(d) {
				return d.source.x;
			})
				.attr("y1", function(d) {
					return d.source.y;
				})
				.attr("x2", function(d) {
					return d.target.x;
				})
				.attr("y2", function(d) {
					return d.target.y;
				});

			node.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			});
		});

		$("#input-control").fadeOut();

	}

});