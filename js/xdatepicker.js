(function( global , undefined){

    var userAgent = navigator.userAgent;

    var m=userAgent.match(/MSIE\s([^;]*)/),
        msie = 0;
    if( m && m[1] ){
        msie = parseFloat(m[1]);
    }



    var bindEvent,unbindEvent,contains = document.documentElement.compareDocumentPosition ?
        function( a, b ) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!( bup && bup.nodeType === 1 && (
                adown.contains ?
                    adown.contains( bup ) :
                    a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
                ));
        } :
        function( a, b ) {
            if ( b ) {
                while ( (b = b.parentNode) ) {
                    if ( b === a ) {
                        return true;
                    }
                }
            }
            return false;
        };

    if( document.documentElement.addEventListener ){
        bindEvent = function( element , type , handler ){
            element.addEventListener( type , handler , false );
        };
        unbindEvent = function( element , type , handler ){
            element.removeEventListener( type , handler , false );
        };

    }else if(document.documentElement.attachEvent){
        bindEvent = function( element , type , handler ){
            element.attachEvent( 'on' + type , handler );
        };
        unbindEvent = function( element , type , handler ){
            element.detachEvent( 'on' + type , handler );
        };
    }else{
        bindEvent = unbindEvent = function(){};
    }



    function EventHandler( element , type , handler ){
        var _handler;

        if( type==='mouseenter' && typeof element.onmouseenter === 'undefined'){

            _handler = function( evt ){
                evt = evt || global.event;
                var relatedTarget = evt.relatedTarget || evt.fromElement;

                if( !relatedTarget || element !== relatedTarget && !contains(element,relatedTarget) )
                    handler.call(this ,evt)
            }

            type = 'mouseover';

        }else if( type==='mouseleave' && typeof element.onmouseleave === 'undefined' ){

            _handler = function( evt ){
                evt = evt || global.event;
                var relatedTarget = evt.relatedTarget || evt.toElement;

                if( !relatedTarget || !contains(element,relatedTarget) )
                    handler.call(this ,evt)
            }

            type = 'mouseout';

        }else{

            _handler = function( evt ){
                evt = evt || global.event;
                handler.call( this , evt );
            };

        }

        if( element ){
            bindEvent( element , type , _handler );
            this.remove = function(){
                unbindEvent( element , type , _handler );
            };
        }else{
            this.remove = function(){};
        }
    }

    function preventDefault( evt ){
        if( evt.preventDefault )
            evt.preventDefault();
        else
            evt.returnValue = false;

    }

    var id = 1;

    function Datepicker( input , opts ){

        var me = this;

        me._opts = opts || {};

        var _default = getDefaultOpts();

        for( var x in _default ){
            if( _default[ x ] !== undefined && me._opts[ x ] === undefined  )
                me._opts[ x ] = _default[x];
        }

        me.silent = true;
        me._opts.id = id++;
        me._event = {};
        /*
            ldd     last drawed date
            ls      last selected date
            lsdd    drawed date when last select
            cc      count of created calendar
            nm      next months
            pm      prev months
         */
        me._status = {};
        me.disabled = false;
        me._disabledDates = [];

        me._render( input );

		me._opts.maxDate && me.setMaxDate( me._opts.maxDate );
        me._opts.minDate && me.setMinDate( me._opts.minDate );
		me._opts.label && me.setLabel( me._opts.label );
        me._opts.disabled && me.setDisabled( true );

        arrayEach( me._opts.disabledDates || [] , function( date ){
            me.addDisabledDate( date );
        });

        me.refresh();

        me.silent = false;

    }


    Datepicker.prototype._wrapInput = function( input ){
        var dom = [];
        dom.push('<div class="' , this._opts.CLASS_WRAPPER , '" id="' ,  this._generateId('wrapper') , '">');
        dom.push(   '<div class="', this._opts.CLASS_INNER ,'" id="', this._generateId('inputwrapper'),'">');
        dom.push(       '<div class="',this._opts.CLASS_LABEL,'" id="' , this._generateId('label'), '"></div>');
        dom.push(       '<input>');
        dom.push(       '<div class="',this._opts.CLASS_ICON_WRAPPER,'">');
        dom.push(           '<i class="',this._opts.CLASS_ICON,'" id="' , this._generateId('icon'), '">&#xf133;</i>');
        dom.push(           '<div class="',this._opts.CLASS_TEXT,'" id="' , this._generateId('tip'), '"></div>');
        dom.push(       '</div>');
        dom.push(   '</div>');
        dom.push(   '<div class="',this._opts.CLASS_PANEL_WRAP,'">');
        dom.push(       '<div class="',this._opts.CLASS_PANEL,'" id="' ,this._generateId('calendarwrapper') , '" style="display:none">');
        dom.push(           '<div class="',this._opts.CLASS_PANEL_INNER,'">')
        dom.push(               '<div class="', this._opts.CLASS_CALENDAR ,'" id="' , this._generateId('calendar') , '">');
        dom.push(                   '<div class="' , this._opts.CLASS_NAV_WRAPPER, '">');
        dom.push(                       '<i class="' , this._opts.CLASS_NAV_PREV , '" data-id="prev" id="' , this._generateId('prev') , '">&#xf053;</i>');
        dom.push(                       '<i class="' , this._opts.CLASS_NAV_NEXT, '" data-id="next" id="' ,this._generateId('next') , '">&#xf054;</i>');
        dom.push(                   '</div>');
        dom.push(                   '<div class="' , this._opts.CLASS_CALENDAR_CONTENT , '">');
        dom.push(                       '<div class="' , this._opts.CLASS_MONTHS_WRAPPER , '"id="' , this._generateId('calendarcontent'),'"></div>');
        dom.push(                   '</div>');
        dom.push(               '</div>');
        dom.push(           '</div>');
        dom.push(       '</div>');
        dom.push(   '</div>');
        dom.push('</div>');


        var div = document.createElement('div'),
            wrapper;
        div.innerHTML = dom.join('');

        wrapper = div.firstChild;

        input.parentNode.insertBefore( wrapper ,input );


        var calendarElement = this._getElement('calendar');

        if( this._opts.noWrap ){
            calendarElement = calendarElement.parentNode.removeChild( calendarElement );
            wrapper.parentNode.replaceChild( calendarElement , wrapper );
            wrapper = null;
        }else{
            var _tmpInput = wrapper.getElementsByTagName('input')[0];
            _tmpInput.parentNode.replaceChild(input , _tmpInput);
        }

        div = null;

        addClass( input , this._opts.CLASS_INPUT );
        this.element.input = input;

        this.element.wrapper = wrapper;
        this.element.tip = this._getElement( 'tip' );
        this.element.label = this._getElement( 'label' );
        this.element.icon = this._getElement('icon');
        this.element.calendarwrapper = this._getElement( 'calendarwrapper' );
        this.element.inputwrapper = this._getElement('inputwrapper');
        this.element.calendar = calendarElement;
        this.element.calendarcontent = this._getElement('calendarcontent');
        this.element.prev = this._getElement('prev');
        this.element.next = this._getElement('next');

        if( this._opts.renderTo )
            this._opts.renderTo.appendChild( this.element.calendar );

        if( this._opts.noLabel && this.element.label ){
            this.element.label.parentNode.removeChild( this.element.label );
            this.element.label = null;
        }

        var selectElement = this.element.tip && this.element.tip.parentNode;

        if( selectElement ){
            if( this._opts.noTip ){
                selectElement.removeChild( this.element.tip );
                this.element.tip = null;
            }

            if( this._opts.noIcon && this.element.icon ){
                selectElement.removeChild( this.element.icon );
                this.element.icon = null;
            }

            if( !selectElement.firstChild )
                selectElement.parentNode.removeChild( selectElement );
        }
    };

    Datepicker.prototype.setDisabled = function( disabled ){

        disabled = !!disabled;

        if( this.disabled == disabled )
            return;

        if( this.disabled = disabled ){
            addClass( this.element.wrapper || this.element.input , this._opts.CLASS_DISABLE );
            this.element.input.disabled = true;
            this.close();
        }else{
            removeClass( this.element.wrapper || this.element.input , this._opts.CLASS_DISABLE );
            this.element.input.disabled = false;
        }
    };

    Datepicker.prototype._createCalendar = function( num ){
        var _x = [],
            opts = this._opts,
            startDay = opts.startDay;

        this._status.cc = num;

        for( var i = 0 ; i < num ; i++ ){

            _x.push( '<div class="'+ opts.CLASS_MONTH_WRAPPER +'">' );

            //title
            _x.push('<div class="',opts.CLASS_MONTH_TITLE,'" data-id="mtitle"></div>');

            //body
            _x.push('<div class="', opts.CLASS_CALENDAR_DATES_WRAPPER ,'"><table cellpadding="0" cellspacing="0">' , '<thead>' , '<tr>');
            for(var j = 0 , _w = opts.LANG_DAYS_NAMES ; j < 7 ; j++){
                var _n = ( j + startDay ) % 7;
                _x.push('<th scope="col" class="' + opts.CLASS_WEEK_PREFIX + _n +'">' , _w[ _n ] || '' , '</th>' );
            }
            _x.push('</tr></thead></table>' );
            _x.push('<table data-id="month" cellpadding="0" cellspacing="0"><tbody>');

            for( var j = 0 , row = new Array(8).join('<td><span data-id="cell"></span></td>') ; j < 6 ; j++ ){
                _x.push('<tr>', row , '</tr>');
            }
            _x.push('</tbody></table></div>');
            _x.push( '</div>' );
        }
        return _x.join('');
    };

    Datepicker.prototype.setDate = function( date ){
        this._setDateByValidateResult( this._validate( date ) );
    };

    Datepicker.prototype._setDateByValidateResult = function( validateResult ){

        this.element.input.value = validateResult.formatted;
        this.setTip( validateResult.tip );

        if( ( validateResult.curDate && validateResult.curDate.getTime() ) !== ( this._date && this._date.getTime() )){
            var oldDate = this._date;
            this._date = validateResult.curDate;
            this.trigger('change', validateResult.curDate , oldDate );
        }

        if( validateResult.success ){
            removeClass(this.element.wrapper,this._opts.CLASS_ERROR );
        }else{
            addClass(this.element.wrapper,this._opts.CLASS_ERROR );
        }

    };

    Datepicker.prototype.bind = function( type , handler ){
        if( !this._event[ type ] )
            this._event[ type ] = [];
        this._event[ type ].push( handler );
        return this;
    };


    Datepicker.prototype.getNow = function(){
        return this._opts.now && this._opts.now.call( this ) || new Date();
    };

    Datepicker.prototype.getDefaultDate = function( force ){
        var _date;
        _date = this._date;
        if( force !== true && !_date && this._opts.allowBlank )
            return _date;
        if( _date && this._validate( _date ).success  )
            return _date;
        _date = this.getDate();
        if( _date && this._validate( _date ).success  )
            return _date;
        _date = this.getNow();
        if( this._validate( _date ).success  )
            return _date;
        if( this.minDate && this.maxDate ){
            var _date = new Date( this.minDate.getTime() );
            while( !this._validate( _date ).success ){
                _date = _date.setDate( _date.getDate() + 1 );
                if( _date > this.maxDate )
                    return null;
            }
            return _date;
        }else
            return this.minDate || this.maxDate;
    };

    Datepicker.prototype.unbind = function( type , handler ){
        if( !this._event[ type ] )
            return;

        for( var i = 0 ; i < this._event[ type ].length ; i++ ){
            if( this._event[ type ][i] === handler )
                this._event[ type ].splice( i-- , 1 );
        }
        return this;
    };

    Datepicker.prototype.trigger = function( type , value ){

        if( this.silent || !this._event[ type ] )
            return;

        for( var i = 0 , len = this._event[ type ].length ; i < len ; i++ ){
            this._event[ type ][ i ].apply( this , Array.prototype.slice.call( arguments , 1 ) );
        }
    };

    Datepicker.prototype.setLabel = function( html ){
        if( this.element.label )
            this.element.label.innerHTML = html;
    };

    Datepicker.prototype.setTip = function( html ){
        if( this.element.tip )
            this.element.tip.innerHTML = html;
    };

    Datepicker.prototype.setMaxDate = function( date ){
        this.maxDate = date && this._( date );
    };

    Datepicker.prototype.setMinDate = function( date ){
        this.minDate = date && this._( date );
    };

    Datepicker.prototype.getDateTip = function( curDate ){};


    Datepicker.prototype._validate = function( date ){

        var errorMessage = '',
            tip,
            formatted = '',
            curDate;

        if( this._opts.allowBlank && typeof date === 'string' && date === '' ){
            // allow blank
        }else{
            curDate = this._( date );
            tip = this.getDateTip( curDate );

            if (curDate == null)
                errorMessage = this._opts.LANG_ERR_FORMAT;
            else if(this._isDateDisabled( curDate )){
                errorMessage = this._opts.LANG_OUT_OF_RANGE;
            }
            formatted = !errorMessage ? this._opts.formatDate.call( this ,  curDate ) : '';
        }

        var _rlt = {
            success: !errorMessage,
            tip: errorMessage || tip && tip.text || '',
            formatted : formatted,
            curDate : curDate
        };
        return _rlt;
    };

    Datepicker.prototype.refreshCalendar = function( baseOnValue ){

        var date = this.getDate(),
//            ls = this._status.ls,
//            lsdd = this._status.lsdd,
            ldd = baseOnValue === true ? null : this._status.ldd,
            diff = ldd && date && countMonthInterval( date , ldd ) || null,
            numberOfMonths = this._opts.numberOfMonths,
            showDate;

//        if( ls && lsdd && ls.getTime() === date.getTime() && lsdd.getTime() === ldd.getTime() ){
//            showDate = ldd;
//        }else
//            showDate = date || this.getDefaultDate();


        if( diff !== null && diff < numberOfMonths && diff >= 0)
            showDate = ldd;
        else
            showDate = date || this.getDefaultDate(true);

        var isValid = this._fullUpdate( showDate );

        return isValid === false ? false : showDate;
    };

    Datepicker.prototype.show = function(){
        this.visible = true;
        this.element.wrapper.style.display = '';
    };

    Datepicker.prototype.hide = function(){
        this.visible = false;
        this.element.wrapper.style.display = 'none';
    };

    Datepicker.prototype.open = function(){

        if( this.opened )
            return this;
        this.opened = true;

        var showDate = this.refreshCalendar();

        if( showDate === false ){
            return this;
        }

        addClass( this.element.wrapper , this._opts.CLASS_OPEN );

        this.element.calendarwrapper && ( this.element.calendarwrapper.style.display = 'block' );

        this.onOpen();

        this.trigger('open' , showDate );

        return this;
    };

    Datepicker.prototype.onOpen = function(){};

    Datepicker.prototype.close = function(){
        if( !this.opened || this._opts.preventHide === true )
            return this;

        this.opened = false;

        this.element.calendarwrapper && ( this.element.calendarwrapper.style.display = 'none');

        removeClass( this.element.wrapper , this._opts.CLASS_OPEN );

        this.onClose();

        this.trigger('close');

        return this;
    };

    Datepicker.prototype.onClose = function(){};

    Datepicker.prototype.toggle = function(){
        if( this.opened )
            this.close();
        else
            this.open();
    };



    Datepicker.prototype._render = function( input ){
        var element = this.element = {};

        this._wrapInput( input );

        element.calendarcontent.innerHTML = this._createCalendar( this._opts.numberOfMonths );

        addClass( element.calendarwrapper , this._opts.CLASS_CALENDAR_WIDTH_PREFIX + this._opts.numberOfMonths );

        for( var i = 0 , allElements = element.calendar.getElementsByTagName('*') , len = allElements.length , name ; i < len ; i++  ){
            name = allElements[i].getAttribute('data-id');
            if( name ){
                if( !element[name] )
                    element[ name ] = [];
                if( element[ name ].push )
                    element[ name ].push( allElements[i] );
            }
        }

        this.onRender();
        this._initEvent();
    };

    Datepicker.prototype.onRender = function(){};

    Datepicker.prototype.onNextClick = function(){

        var me = this,
            status = this._status;

        if( !status.nm )
            return;

        var thisMonth = new Date( status.ldd.getTime() );
        thisMonth.setDate(1);
        thisMonth.setMonth( thisMonth.getMonth() + status.nm );
        me._fullUpdate( thisMonth );
        me.trigger('changemonth',thisMonth);

    };

    Datepicker.prototype.onPrevClick = function( ){

        var me = this,
            status = this._status;

        if( !status.pm )
            return;

        var thisMonth = new Date( status.ldd.getTime() );
        thisMonth.setDate(1);
        thisMonth.setMonth( thisMonth.getMonth() - status.pm );
        this._fullUpdate( thisMonth );
        this.trigger('changemonth',thisMonth);
    };

    Datepicker.prototype.onCellClick = function( cell ){
        if( !cell.disabled ){
            this.trigger('select', this._( cell.dateValue ) );
            this.setDate( cell.dateValue );
            this._status.ls =  this._date;
            this._status.lsdd = this._status.ldd;

            if( this._opts.preventHide === true )
                this._fullUpdate( this._status.ldd );
            else
                this.close();
        }
    };

    Datepicker.prototype.onCellMouseOver = function( cell ){
        if( !cell.disabled ){
            addClass( cell.parentNode , this._opts.CLASS_CELL_HOVER);
        }
        this.trigger('cellmouseover',cell , cell.dateValue , cell.disabled );

    };

    Datepicker.prototype.onCellMouseOut = function( cell ){
        if( !cell.disabled ){
            removeClass( cell.parentNode , this._opts.CLASS_CELL_HOVER);
        }
        this.trigger('cellmouseout',cell,cell.dateValue,cell.disabled);
    };

    Datepicker.prototype.onInput = function(){
        var validateResult = this._validate( this.getRawValue() );
        this.setTip( validateResult.tip );

        if( this.opened && validateResult.success ){
            var curDate = validateResult.curDate,
                ldd = this._status.ldd,
                numberOfMonths = this._opts.numberOfMonths;

            if( !curDate || ( curDate.getFullYear() - ldd.getFullYear() ) * 12 + curDate.getMonth() - ldd.getMonth() < numberOfMonths )
                this._fullUpdate( ldd );
            else
                this._fullUpdate( validateResult.curDate );
        }

        if( validateResult.success ){
            removeClass(this.element.wrapper , this._opts.CLASS_ERROR );
        }else{
            addClass(this.element.wrapper , this._opts.CLASS_ERROR );
        }
    };


    Datepicker.prototype.onFocus = function(){
        addClass( this.element.wrapper , this._opts.CLASS_FOCUS);
    };

    Datepicker.prototype.onBlur = function(){
        removeClass( this.element.wrapper , this._opts.CLASS_FOCUS);
        this.refresh();
        this.close();
    };

    Datepicker.prototype.refresh = function(){
        var _date = this.getRawValue();

        var validateResult = this._validate( _date );

        if( this._opts.correctOnError ){

            if( !validateResult.success ){
                _date = this.getDefaultDate();
                validateResult = this._validate( _date );
                if( !validateResult.success ){
                    validateResult.formatted = '';
                }
            }
            this._setDateByValidateResult( validateResult );
        }
    };

    Datepicker.prototype.destroy = function(){
        arrayEach( this._eH , function( eventHandler){
            eventHandler.remove();
        });

        this._eH.length = 0;

        if( this.element.calendar ){
            this.element.calendar.parentNode.removeChild( this.element.calendar );
        }

        if( this.element.wrapper ){
            this.element.wrapper.parentNode.insertBefore( this.element.input , this.element.wrapper );
            this.element.wrapper.parentNode.removeChild( this.element.wrapper );
        }

        removeClass( this.element.input , this._opts.CLASS_INPUT );
        this.element = null;

        return this;
    }

    Datepicker.prototype._initEvent = function(){


        var element = this.element,
            wrap = element.calendar,
            input = element.input,
            inputWrapper = element.inputwrapper,
            tip = element.tip,
            label = element.label,
            me = this;

        var eH = this._eH = [];


        var _m_down = 0 ,
			last = this.getRawValue();

        //event

        arrayEach([ wrap , tip , label ] , function( el ){
            eH.push(new EventHandler( el , 'mousedown', function( evt ){
                preventDefault( evt );
                _m_down = 1;
//			    input.focus();
            }));
        });


        var _input = inputWrapper || input;

        eH.push(new EventHandler( _input , 'mouseup', function( evt ){
            if( me.disabled )
                return;

            ( evt.target || evt.srcElement ) !== input && preventDefault( evt );
            me.toggle();
            try{
                input.focus();
            }catch(e){}

        }));

        eH.push(new EventHandler( _input , 'mouseenter', function( evt ){
            addClass( _input , me._opts.CLASS_HOVER );
        }));

        eH.push(new EventHandler( _input , 'mouseleave', function( evt ){
            removeClass( _input , me._opts.CLASS_HOVER );
        }));


        eH.push(new EventHandler( input , 'focus', function( evt ){
            _m_down = 0;
            me.onFocus();
        }));

        eH.push(new EventHandler( input , 'blur', function( evt ){
            me.onBlur();
        }));

        eH.push(new EventHandler( input , 'oninput' in input ? "input" : 'onpropertychange' in input ? 'propertychange' : 'keyup' , function( evt ){
            if( input.value !== last )
                me.onInput();
            last = input.value;
        }));

        msie > 0 && msie < 11 && eH.push(new EventHandler( input , 'beforedeactivate', function( evt ){
            if( _m_down )
                preventDefault( evt );
            _m_down = 0;
        }));

        eH.push(new EventHandler( input , 'dragover', function( evt ){
            preventDefault( evt );
            evt.dataTransfer && ( evt.dataTransfer.dropEffect = 'none');
        }));


        eH.push(new EventHandler( input , 'drop', function( evt ){
            preventDefault( evt );
        } ));

        //init calendar events
        for( var events = ['Click','MouseOver','MouseOut'] , eventType , i = 0 ; eventType = events[ i ] ; i++ ){
            (function( eventType ){
                eH.push(new EventHandler( wrap , eventType.toLowerCase() , function( evt ){
                    var target = evt.target || evt.srcElement,
                        eventName;
                    do{

                        if( target === wrap )
                            break;
                        else if( ( eventName = target.getAttribute('data-id') ) != null ){

                            var name = 'on'
                                + eventName.charAt(0).toUpperCase() + eventName.substr(1)
                                + eventType;

                            if( me[name ] ){
                                me[name]( target );
                            }
                        }
                    }while( target = target.parentNode );
                }));
            })( eventType );
        }
    };

    Datepicker.prototype._fullUpdate = function( date ){

        if( !( date instanceof Date ) || isNaN( date.getTime()) )
            return false;

        var element = this.element,
            startDay = this._opts.startDay,
            thisMonth = new Date( date.getFullYear() , date.getMonth() , 1),
            showOtherMonths = this._opts.showOtherMonths,
            numberOfMonths = this._opts.numberOfMonths,
            stepMonths = this._opts.stepMonths,
            minDate = this.minDate,
            maxDate = this.maxDate,
            tmpMonth,
            prevMonths = minDate ? (tmpMonth = countMonthInterval( thisMonth , minDate )) > 0 &&  Math.min( tmpMonth , stepMonths ) || 0 : stepMonths,
            nextMonths = maxDate ? (tmpMonth = countMonthInterval( maxDate , thisMonth ) - numberOfMonths + 1  ) > 0 && Math.min( tmpMonth , stepMonths ) || 0: stepMonths;

        this._status.ldd = date;
        this._status.nm = nextMonths;
        this._status.pm = prevMonths;

        if( prevMonths ){
            removeClass( element.prev , this._opts.CLASS_NAV_PREV_DISABLED );
        }else{
            addClass( element.prev , this._opts.CLASS_NAV_PREV_DISABLED );
        }

        if( nextMonths ){
            removeClass( element.next , this._opts.CLASS_NAV_NEXT_DISABLED );
        }else{
            addClass( element.next , this._opts.CLASS_NAV_NEXT_DISABLED );
        }

        for( var i = 0 ; i < this._status.cc ; i++ ){
            var curDate = new Date( thisMonth.getFullYear() , thisMonth.getMonth() , 1 - ( thisMonth.getDay() - startDay + 7 ) % 7 );
            element.mtitle[ i ].innerHTML = this._opts.formatMonth.call( this , thisMonth );
            element.month[i].className = element.month[i].className.replace(/(month_)\d+/,"$1" + ( thisMonth.getMonth() + 1 ));

            for( var j = 0 , cell ; j < 42 ; j++ ){

                cell = element.cell[ 42 * i + j ];

                var isCurrentMonth = curDate.getMonth() === thisMonth.getMonth() && curDate.getFullYear() === thisMonth.getFullYear(),
                    _cellValue = showOtherMonths || isCurrentMonth ? curDate : null,
                    isDisabled = this._isDateDisabled( curDate );

                cell.dateValue = _cellValue && _cellValue.getTime() || undefined;
                cell.disabled = isDisabled || !cell.dateValue;
                this._cellUpdate( cell , _cellValue , thisMonth , isDisabled , this.getDate() , cleanDate(this.getNow()) );

                curDate.setDate( curDate.getDate() + 1 );

                if( j >= 35 ){
                    cell.style.display = !isCurrentMonth ? 'none' : '';
                }
            }

            thisMonth.setMonth( thisMonth.getMonth() + 1 );
        }

        this.trigger('calendarupdate',date );


    };

    Datepicker.prototype._cellUpdate = function( cell , curDate , currentMonth , disabled , selectedDate , now  ){

        if( !curDate ){
            cell.parentNode.className = this._opts.CLASS_CELL_NOTHING;
            cell.innerHTML = '&nbsp;';
        }else{

            var _x = [],
                tip = this.getDateTip( curDate ),
                cellClass = tip && tip.cellClass,
                cellText = tip && tip.cellText || curDate.getDate();

            cell.innerHTML = cellText;

            if( cellClass )
                _x.push(cellClass);

            _x.push(this._opts.CLASS_WEEK_PREFIX + curDate.getDay());

            if( curDate.getMonth() !== currentMonth.getMonth() || curDate.getFullYear() !== currentMonth.getFullYear() )
                _x.push( this._opts.CLASS_CELL_OTHERMONTH );
            if( curDate.getTime() === now.getTime() )
                _x.push( this._opts.CLASS_CELL_TODAY );
            if( selectedDate && curDate.getTime() === selectedDate.getTime() )
                _x.push( this._opts.CLASS_CELL_SELECTED );
            if( disabled )
                _x.push( this._opts.CLASS_CELL_DISABLED );

            cell.parentNode.className = _x.join(' ');
        }

        this.trigger('cellupdate', cell , curDate , currentMonth , disabled , selectedDate , now );
    };

    Datepicker.prototype.addDisabledDate = function( date ){
        var time = this._( date );
        if( time )
            this._disabledDates.push( time.getTime() );

        return this;
    };

    Datepicker.prototype.removeDisabledDate = function( date ){
        date = this._( date );

        var disabledDates = this._disabledDates;
        if( date )
            for( var i = 0 ; i < disabledDates.length ; i++ ){
                if( disabledDates[i] === date.getTime() )
                    disabledDates.splice( i-- , 1 );
            }

        return this;
    };

    Datepicker.prototype.removeAllDisabledDate = function(){
        this._disabledDates.length = 0;
        return this;
    };

    Datepicker.prototype._isDateDisabled = function( date ){

        var time = date.getTime(),
            minDate = this.minDate,
            maxDate = this.maxDate,
            disabledDates = this._disabledDates;

        if( minDate && time < minDate.getTime() )
            return true;
        else if( maxDate && time > maxDate.getTime() )
            return true;
        else if( disabledDates ){
            for( var i = 0 , len = disabledDates.length ; i < len  ; i++){
                if( disabledDates[i] === time  )
                    return true;
            }
        }

        return false;
    }

    Datepicker.prototype._ = function( date ){

        var d;

        switch( Object.prototype.toString.call(date) ){
            case '[object Date]' :
                d = new Date( date.getTime() );
                break;
            case '[object Number]' :
                d = new Date( date );
                break;
            case '[object String]' :
                d = this._opts.parseDate.call( this , date );
                break;
        }

        return d && cleanDate(d);
    };

    Datepicker.prototype.getRawValue = function(){
        return this.element.input.value;
    };

    Datepicker.prototype.getDate = function(){
        return this._( this.getRawValue() );
    };


    Datepicker.prototype._generateId = function( type  ){
        return 'datepicker-' + this._opts.id + '-' + type ;
    };

    Datepicker.prototype._getElement = function( type ){
        return document.getElementById( 'datepicker-' + this._opts.id + '-' + type );
    };

    Datepicker.getDefaultOpts = getDefaultOpts;



    var DEFAULT_OPTS = {

        CLASS_CELL_NOTHING : 'ui-calendar-blank',
        CLASS_CELL_TODAY : 'ui-calendar-today',
        CLASS_CELL_OTHERMONTH : 'ui-calendar-othermonth',
        CLASS_CELL_SELECTED : 'ui-calendar-selected',
        CLASS_CELL_DISABLED : 'ui-calendar-disabled',
        CLASS_CELL_HOVER : 'ui-calendar-day-hover',
        CLASS_WEEK_PREFIX : 'ui-calendar-w',

        CLASS_NAV_WRAPPER : 'ui-calendar-nav',
        CLASS_NAV_PREV : 'ui-calendar-prev ui-icon ui-icon-chevron-left',
        CLASS_NAV_NEXT : 'ui-calendar-next ui-icon ui-icon-chevron-right',
        CLASS_NAV_PREV_DISABLED : 'ui-calendar-prev-disabled',
        CLASS_NAV_NEXT_DISABLED : 'ui-calendar-next-disabled',

        CLASS_MONTHS_WRAPPER : 'ui-calendar-months',
        CLASS_MONTH_WRAPPER : 'ui-calendar-month',
        CLASS_MONTH_TITLE : 'ui-calendar-name',

        CLASS_CALENDAR_WIDTH_PREFIX : 'ui-calendar-width-',
        CLASS_CALENDAR : 'ui-calendar',
        CLASS_CALENDAR_DATES_WRAPPER : 'ui-calendar-day',
        CLASS_CALENDAR_CONTENT : 'ui-calendar-content',

        CLASS_PANEL_WRAP : 'ui-calendarbox-panel-wrap',
        CLASS_PANEL : 'ui-calendarbox-panel',
        CLASS_PANEL_INNER : 'ui-calendarbox-panel-inner',

        CLASS_WRAPPER : 'ui-datepicker',
        CLASS_FOCUS : 'ui-datepicker-focus',
        CLASS_DISABLE : 'ui-datepicker-disabled',
        CLASS_HOVER : 'ui-datepicker-hover',
        CLASS_ERROR : 'ui-datepicker-error',
        CLASS_INNER : 'ui-datepicker-source',
        CLASS_LABEL : 'ui-datepicker-label',
        CLASS_ICON_WRAPPER : 'ui-datepicker-icon-wrap',
        CLASS_ICON : 'ui-datepicker-icon ui-icon ui-icon-calendar-o',
        CLASS_TEXT : 'ui-datepicker-text',
        CLASS_INPUT : 'ui-datepicker-input',
        CLASS_OPEN : 'ui-datepicker-open',

        LANG_DAYS_NAMES : ['日', '一', '二', '三', '四', '五', '六'],
        LANG_OUT_OF_RANGE : '超出范围',
        LANG_ERR_FORMAT : '格式错误',
        startDay: 1,
        cls : '',
        showOtherMonths: false,
        disabledDates : '',  // Function Array
        numberOfMonths: 2,
        correctOnError: true,
        allowBlank : false,
        minDate : null,
        maxDate : null,
        stepMonths : 1,
        formatMonth: function(date){
            return '<span class="year">' + date.getFullYear() + '年</span>' + (date.getMonth() + 1) + '月'
        },
        parseDate : function( str ){
            var x = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate : function( date ){
            return date.getFullYear() + "-" + formatNum( date.getMonth() + 1 , 2 ) + "-" + formatNum( date.getDate() , 2 );
        },
        now : function(){
            return typeof SERVER_TIME !== 'undefined' && SERVER_TIME.getTime && new Date( SERVER_TIME.getTime() );
        }
    };


    Datepicker.utils = {
        addClass : addClass,
        removeClass : removeClass,
        trim : trim,
        cleanDate : cleanDate,
        contains : contains,
        EventHandler : EventHandler
    };

    function getDefaultOpts(){
        return DEFAULT_OPTS;
    }

    function arrayEach( arr , func ){
        for( var i = 0 , len = arr.length; i < len ; i++ ){
            func.call(arr[i],arr[i],i);
        }
    }

    function formatNum ( n , length ){
        n = String(n);
        for( var i = 0 , len = length - n.length ; i < len ; i++)
            n = "0" + n;
        return n;
    }

    function countMonthInterval( a , b ){
        return ( a.getFullYear() - b.getFullYear() ) * 12 + a.getMonth() - b.getMonth();
    }

    function trim( str ){
        if( str.trim )
            return str.trim();
        else
            return str.replace(/^\s+/,'').replace(/\s+$/,'');
    }

    function addClass( element , className ){

        if( !element )
            return;

        var classes = ( className || "" ).match( /\S+/g ) || [],
            cls,
            j;

        var curClass = element.nodeType === 1 && ( element.className ?
            ( " " + element.className + " " ).replace( /\r\n\t/g, " " ) :
            " "
            );

        if( curClass ){
            j = 0;
            while ( (cls = classes[j++]) ) {
                if ( curClass.indexOf( " " + cls + " " ) < 0 ) {
                    curClass += cls + " ";
                }
            }
            element.className = trim( curClass );
        }
    }

    function removeClass( element , className ){

        if( !element )
            return;

        var classes = ( className || "" ).match( /\S+/g ) || [],
            cls,
            j;

        var curClass = element.nodeType === 1 && ( element.className ?
            ( " " + element.className + " " ).replace( /\r\n\t/g, " " ) :
            " "
            );

        if( curClass ){
            j = 0;
            while ( (cls = classes[j++]) ) {
                while ( curClass.indexOf( " " + cls + " " ) >= 0 ) {
                    curClass = curClass.replace( " " + cls + " ", " " );
                }
            }
            element.className = trim( curClass );
        }
    }


    function cleanDate( date ){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    global.XDatepicker = Datepicker;
})(window);
