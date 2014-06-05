(function(global , Datepicker){

    var _c = { 	'+M' : function( time , n ) { var _d = time.getDate();time.setMonth( time.getMonth() + n );if( time.getDate() !== _d )time.setDate(0); },
        '-M' : function( time , n ) { var _d = time.getDate();time.setMonth( time.getMonth() - n );if( time.getDate() !== _d ){time.setDate(0)}; },
        '+D' : function( time , n ) { time.setDate( time.getDate() + n ) },
        '-D' : function( time , n ) { time.setDate( time.getDate() - n ) },
        '+Y' : function( time , n ) { time.setFullYear( time.getFullYear() + n ) },
        '-Y' : function( time , n ) { time.setFullYear( time.getFullYear() - n ) }
    };

    function calcDate( desc , date ){
        desc = ( desc || "" ).toString();
        var time;
        if( date )
            time = new Date( date.getTime() );
        else{
            time = new Date();
        }
        var re = /([+-])?(\d+)([MDY])?/g , arr;
        while( arr = re.exec( desc ) ){
            var key = (arr[1] || '+') + ( arr[3] || 'D' );
            if( _c[key] )
                _c[key]( time , arr[2] * 1);
        }
        return time;
    }


    /*
        Date Range Picker
     */

    function DateRangePicker( from , to ,opts ){

        var optArray = splitOptions( opts || {} );

        this.element = {
            from : from ,
            to : to
        };

        this.from = new Datepicker( from , optArray[0] );
        this.to = new Datepicker( to , optArray[1] );

        this._opts = optArray[2];

        bindPickers( this.from , this.to , this._opts  );

    }

    var splitOptions = DateRangePicker.splitOptions = function( opts ){

        var _default = getDefaultOpts(),
            optsNew = {},
            x;

        for( x in opts )
            optsNew[x] = opts[x];



        for( var x in _default ){
            if( _default[ x ] !== undefined && optsNew[ x ] === undefined )
                optsNew[ x ] = _default[x];
        }


        return [ getFromOpts(optsNew),getToOpts(optsNew) , optsNew ];
    };

    var bindPickers = DateRangePicker.bindPickers = function( from , to , opts , refresh ){
        if( refresh === undefined )
            refresh = true;

        _initEvent( from , to , opts , refresh );
    };

    var _initEvent = function( from , to , opts , refresh ){

        var fromChangeFunc;

        from.bind('select',function(){

            to._status.ldd = from._status.ldd;

            if( opts.focusSecondOnFirstSelect ){
                try{
                    to.element.input.focus();
                }catch(e){}

                setTimeout( function(){ to.open(); } , 0 );
            }
        }).bind('change',fromChangeFunc = function( date ){

            var rules = opts.rules || '',
                linkRules = rules.length > 0 ? rules.split(',') : [];

            var df = {};

            for( var i = 0 , type = ['defaultDate', 'minDate', 'maxDate'] ; i < type.length ; i++ ){
                if (linkRules[ i ])
                    df[ type[ i ] ] = calcDate(linkRules[i], date)
            }

            var minDate = to._( to._opts.minDate ), maxDate = to._( to._opts.maxDate );

            if ( df['minDate'] || minDate ){
                to.setMinDate( ( df['minDate'] ? df['minDate'].getTime() : -1 ) > ( minDate ? minDate.getTime() : -1 ) ? df['minDate'] : minDate );
            }
            if ( df['maxDate'] || maxDate ) {
                to.setMaxDate( ( df['maxDate'] ? df['maxDate'].getTime() : Number.MAX_VALUE ) > ( maxDate ? maxDate.getTime() : Number.MAX_VALUE ) ? maxDate : df['maxDate'] );
            }

            if( !to._validate( to.getRawValue() ).success && to._validate( df['defaultDate'] ).success){
                to.setDate( df['defaultDate'] );
            }else{
                to.refresh();
            }

        });

        from.bind('calendarupdate',function(){
            var fromDate = from.getDate(),
                toDate = to.getDate(),
                rangeStyle = opts.rangeStyle;

            for( var i = 0 , cell ; cell = from.element.cell[i] ; i++){
                if( fromDate && cell.dateValue && cell.dateValue == +fromDate )
                    Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_FROM_CELL);
                if( opts.showRelativeDate !== false && toDate && cell.dateValue && cell.dateValue == +toDate )
                    Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_TO_CELL );
                if( rangeStyle ){
                    if( fromDate && toDate ){
                        if( cell.dateValue < toDate && cell.dateValue > fromDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                        else if( cell.dateValue === +toDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                        else if( cell.dateValue === +fromDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }

            }

        }).bind('cellmouseover',function( cell , date , disabled ){
            if( !opts.rangeStyle || disabled)
                return;
            var toDate = to.getDate(),
                fromDate = from.getDate();
            if( fromDate && toDate ){
                for( var i = 0 , cell ; cell = from.element.cell[i] ; i++){

                    Datepicker.utils.removeClass( cell.parentNode , opts.CLASS_DATE_RANGE + ' ' + opts.CLASS_DATE_RANGE_TO + ' ' +  opts.CLASS_DATE_RANGE_FROM);

                    if( cell.dateValue > date && cell.dateValue < toDate )
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                    else if( date < toDate && cell.dateValue === +toDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                    }else if( cell.dateValue === +date ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }
            }
        }).bind('cellmouseout',function( cell , date , disabled ){
            if( !opts.rangeStyle || disabled)
                return;
            var toDate = to.getDate(),
                fromDate = from.getDate();


            for( var i = 0 , cell ; cell = from.element.cell[i] ; i++){

                Datepicker.utils.removeClass( cell.parentNode , opts.CLASS_DATE_RANGE + ' ' + opts.CLASS_DATE_RANGE_TO + ' ' +  opts.CLASS_DATE_RANGE_FROM);

                if( fromDate && toDate ){
                    if( cell.dateValue > fromDate && cell.dateValue < toDate )
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                    else if( cell.dateValue === +toDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                    }else if( cell.dateValue === +fromDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }

            }

        });


        to.bind('calendarupdate',function(){
            var fromDate = from.getDate(),
                toDate = to.getDate(),
                rangeStyle = opts.rangeStyle;

            for( var i = 0 , cell ; cell = to.element.cell[i] ; i++){
                if( opts.showRelativeDate !== false && fromDate && cell.dateValue && cell.dateValue == +fromDate )
                    Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_FROM_CELL);
                if( toDate && cell.dateValue && cell.dateValue == +toDate )
                    Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_TO_CELL);
                if( rangeStyle ){
                    if( fromDate && toDate ){
                        if( cell.dateValue < toDate && cell.dateValue > fromDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                        else if( cell.dateValue === +toDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                        else if( cell.dateValue === +fromDate )
                            Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }

            }

        }).bind('cellmouseover',function( cell , date ){
            if( !opts.rangeStyle )
                return;
            var fromDate = from.getDate();
            if( fromDate ){
                for( var i = 0 , cell ; cell = to.element.cell[i] ; i++){

                    Datepicker.utils.removeClass( cell.parentNode , opts.CLASS_DATE_RANGE + ' ' + opts.CLASS_DATE_RANGE_TO + ' ' +  opts.CLASS_DATE_RANGE_FROM);

                    if( cell.dateValue > fromDate && cell.dateValue < date )
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                    else if( cell.dateValue === +date ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                    }else if( cell.dateValue === +fromDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }
            }
        }).bind('cellmouseout',function(){
            if( !opts.rangeStyle )
                return;
            var toDate = to.getDate(),
                fromDate = from.getDate();


            for( var i = 0 , cell ; cell = to.element.cell[i] ; i++){

                Datepicker.utils.removeClass( cell.parentNode , opts.CLASS_DATE_RANGE + ' ' + opts.CLASS_DATE_RANGE_TO + ' ' +  opts.CLASS_DATE_RANGE_FROM);

                if( fromDate && toDate ){
                    if( cell.dateValue > fromDate && cell.dateValue < toDate )
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE);
                    else if( cell.dateValue === +toDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_TO);
                    }else if( cell.dateValue === +fromDate ){
                        Datepicker.utils.addClass( cell.parentNode , opts.CLASS_DATE_RANGE_FROM);
                    }
                }

            }

        });

        if( refresh )
            fromChangeFunc( from.getDate() );
    };

    var COPY_OPTS = [
        'LANG_DAYS_NAMES' ,
        'LANG_OUT_OF_RANGE' ,
        'LANG_ERR_FORMAT' ,
        'startDay' ,
        'showOtherMonths' ,
        'numberOfMonths' ,
        'stepMonths',
        'correctOnError' ,
        'allowBlank' ,
        'parseDate' ,
        'formatDate' ,
        'formatMonth' ,
        'now' ,
        'getDateTip',
        'disabledDates',
        'preventHide',
        'noLabel',
        'noIcon',
        'noTip',
        'disabled',
        'noWrap'];

    var DEFAULT_OPTS = {

        CLASS_DATE_FROM_CELL : 'ui-calendar-day-from',
        CLASS_DATE_TO_CELL : 'ui-calendar-day-to',
        CLASS_DATE_RANGE : 'ui-calendar-range',
        CLASS_DATE_RANGE_FROM : 'ui-calendar-range-from',
        CLASS_DATE_RANGE_TO : 'ui-calendar-range-to',

        fromMinDate : undefined,
        toMinDate : undefined,
        fromMaxDate : undefined,
        toMaxDate : undefined,
        fromLabel : undefined,
        toLabel : undefined,
        fromCls : undefined,
        toCls : undefined,
        rules : undefined,
        focusSecondOnFirstSelect : true,
        rangeStyle : true
    };

    function getFromOpts( opts ){
        var x = {
            minDate : opts.fromMinDate,
            maxDate : opts.fromMaxDate,
            label : opts.fromLabel,
            cls : opts.fromCls,
            renderTo : opts.fromRenderTo
        };

        for( var i = 0 , len = COPY_OPTS.length ; i < len ; i++ ){
            x[ COPY_OPTS[i] ] = opts[ COPY_OPTS[i] ];
        }

        return x;

    }

    function getToOpts( opts ){
        var x = {
            minDate : opts.toMinDate,
            maxDate : opts.toMaxDate,
            label : opts.toLabel,
            cls : opts.toCls,
            renderTo : opts.toRenderTo
        };

        for( var i = 0 , len = COPY_OPTS.length ; i < len ; i++ ){
            x[ COPY_OPTS[i] ] = opts[ COPY_OPTS[i] ];
        }

        return x;
    }

    function getDefaultOpts(){
        return DEFAULT_OPTS;
    }

    DateRangePicker.calculateDate = calcDate;

    global.XDateRangePicker = DateRangePicker;

})(window , XDatepicker );