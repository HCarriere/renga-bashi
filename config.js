module.exports = {
    database: {
        //name:'mongodb://localhost/db',
        defaultAddress:{
            prefix:'mongodb',
            name:'localhost',
            database:'cadavres'
        },
        collections : {
            cadavre:'cadavre',
            map:'map',
        },
		verbose:false,
		mongooseDebug:false,
		salt:'jfiou87E094Kdà0IDkdç8DJODI'
    },
    server:{
        port:3000
    },
}
