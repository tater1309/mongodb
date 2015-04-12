var main = function() {
	"use strict";

	displayTopTen();

	$("#btnSubmit").click(function() {
		var url = $("#url").val();
		processResults(url);
	});

};

function processResults(url) {
	
	var urlInfo = {"url": url};

	$.post("/geturl", urlInfo, function(response) {
		var $result = $("<p>").html(response.returnURL);
		$("main .result").empty();
		$("main .result").append($result);
	});
}

function displayTopTen() { 
	$.getJSON("/displayTopTen", function (response){
		$("main .topten").empty();
		var $display = $("<ol>");
		$("main .topten").append($display);
		for (i=0; i<response.length; i++) {
			$display.append($("<li>").text(response[i].short + "   " + response[i].count));
		}
	}); 
}
	
$(document).ready(main);