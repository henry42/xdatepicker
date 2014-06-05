(function(global , Datepicker ){


    function parseDate( str ){
        var x = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
    };


    var initHoliday = function( data ){

        var _table = {},
            _data = [];

        for( var k in data ){
            var v = data[ k ],
                _date = parseDate( k );

            if( _date ){
                v.date = _date;
                _data.push( v );
            }
        }

        _data.sort( function( a , b ){
            return ( a.dayIndex || 0 ) - ( b.dayIndex || 0 );
        });


        for( var k = 0 , len = _data.length ; k < len ; k++ ){

            var v = _data[k],
                _date = v.date,
                beforeTime = v.beforeTime || 0,
                afterTime = v.afterTime || 0;

            _date.setDate( _date.getDate() - beforeTime - 1 );
            for( var i = -v.beforeTime ; i < afterTime + 1 ; i++ ){
                _date.setDate( _date.getDate() + 1 );
                _table[ _date.getTime() ] =  {
                    text : v['holidayName'] + ( i < 0 ? '前' + -i + '天' : i > 0 ? '后' + i + '天' : ''),
                    cellClass : i === 0 && v['holidayClass'] || '',
                    cellText : i === 0 && v['holidayText'] || ''
                };
            }
        }

        return _table;
    };

    var HOLIDAYS = initHoliday( global.HolidayData ) || {};

    var ONE_DAY = 24 * 60 * 60 * 1000;

    Datepicker.prototype.getDateTip = function( curDate ){
        if( !curDate )
            return;

        var now = Datepicker.utils.cleanDate( this.getNow()).getTime(),
            curTime = curDate.getTime();

        if( now == curTime )
            return { text : '今天' , cellClass : 'c_today' , cellText : '今天' };
        else if( now == curTime - ONE_DAY )
            return { text : '明天' , cellClass : '' };
        else if( now == curTime - ONE_DAY * 2 )
            return { text : '后天' , cellClass : '' };

        var tip = HOLIDAYS && HOLIDAYS[ curDate.getTime() ];

        if( !tip ){
            return { text : '周' + this._opts.LANG_DAYS_NAMES[ curDate.getDay() ] };
        }else{
            return tip;
        }
    };



})(window , XDatepicker );