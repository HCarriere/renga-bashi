module.exports = {
    database: {
        //name:'mongodb://localhost/pire-to-pire',
        defaultAddress:{
            prefix:'mongodb',
            name:'localhost',
            database:'cadavres'
        },
        collections : {
            cadavre:'cadavre'
        },
		verbose:true,
		mongooseDebug:false,
		salt:'jfiou87E094Kdà0IDkdç8DJODI'
    },
    server:{
        port:3000
    },
}
