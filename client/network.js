'use strict';

const server = '';

/*
getDeaths(deaths => {
	let myDeaths = deaths;
});
*/
function getDeaths(date, level, callback) {
	$.ajax({
		type:'GET',
		url:server+'/api/cadavres', 
		data:{
			date: date,
			level: level,
		}, 
		success: data => {
			console.log(data);
			callback(data);
		},
		error: (msg) => {
			console.log('error:'+JSON.stringify(msg));
		}, 
		dataType:'json'
	});
}

function getMap(callback, level) {
    if(!level) {
        level = 'START';
    }
	$.ajax({
		type:'GET',
		url:server+'/api/map', 
		data:{
			level: level
		}, 
		success: data => {
			console.log(data);
			callback(data);
		},
		error: (msg) => {
			console.log('error:'+JSON.stringify(msg));
		}, 
		dataType:'json'
	});
}