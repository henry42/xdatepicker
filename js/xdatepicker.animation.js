(function(global , Datepicker ){


    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element){
                return window.setTimeout(callback, 1000 / 60);
            };
    })();

    window.cancelRequestAnimFrame = ( function() {
        return window.cancelAnimationFrame          ||
            window.webkitCancelRequestAnimationFrame    ||
            window.mozCancelRequestAnimationFrame       ||
            window.oCancelRequestAnimationFrame     ||
            window.msCancelRequestAnimationFrame        ||
            clearTimeout
    } )();

    function Timer( element , time , easing , callback , startCallback ){
        var me = this;
        var startTime ;
        var endTime;

        var handler;

        this.next = null;

        var isStarted = false,
            isFinished = false;

        var tick = function(){

            if( isFinished )
                return;


            var nowTime = new Date().getTime();

            if( nowTime >= endTime )
                me.finish();
            else{
                easing.call( element , ( nowTime - startTime ) / time );
                cancelRequestAnimFrame( handler );
                handler = requestAnimFrame( tick , element );
            }
        };

        this.start = function(){
            if( isFinished ){
                this.next && this.next.start();
                return;
            }
            if( isStarted )
                return;
            isStarted = true;
            startTime = new Date().getTime();
            endTime = startTime + time;
            startCallback && startCallback.call(element);
            tick();
        };

        this.add = function( fx ){
            if( this.next )
                this.next.add( fx );
            else{
                this.next = fx;
                if( isFinished )
                    this.next.start();
            }
        }

        this.finish = function(){
            if( isFinished )
                return;
            isFinished = true;

            cancelRequestAnimFrame( handler );

            easing.call( element , 1 );
            callback.call( element );
            if( this.next )
                this.next.start();
        };

        this.finishAll = function(){
            var t = this;
            do{
                t.finish();
            }while( t = t.next )
        };
        //tick();
    }


    var opts = Datepicker.getDefaultOpts();
    opts.stepAnimation = 0;


    var createCalendar = Datepicker.prototype._createCalendar;
    var onNextClick = Datepicker.prototype.onNextClick;
    var onPrevClick = Datepicker.prototype.onPrevClick;
    var onHide = Datepicker.prototype.onHide;
    var onRender = Datepicker.prototype.onRender;


    Datepicker.prototype.onHide = function(){

        if( this._fx ){
            this._fx.finishAll();
            this._fx = null;
        }

        return onHide.apply( this , arguments );
    };

    Datepicker.prototype._createCalendar = function( num ){
        var num = this._opts.stepAnimation ? num + this._opts.stepMonths : num;
        this._status.norm = num;
        return createCalendar.call( this , num );
    };

    Datepicker.prototype.onRender = function(){
        onRender.call( this );

        var element = this.element;

        this._status.defaultCalendarMarginLeft = parseInt(
          ( window.getComputedStyle ?
              element.calendarcontent.ownerDocument.defaultView.getComputedStyle(element.calendarcontent,null) :
              element.calendarcontent.currentStyle || {} )
          ['margin-left'],10)
        || 0;

        if( this._status.norm ){
            //Datepicker.utils.addClass( this.element.calendarcontent , 'calendar_' + this._status.norm );
        }

    };

    Datepicker.prototype.onNextClick = function(){

        if( !this._status.nm || this._status.anm )
            return;

        var me = this,
            opts = this._opts,
            element = this.element,
            status = this._status;

        var callback = function(){
            onNextClick.call( me );
        };


        if( opts.stepAnimation ){

            var width = 0,
                defaultCalendarMarginLeft = this._status.defaultCalendarMarginLeft;

            var timer = new Timer( element.wrapper , opts.stepAnimation , function( percent ){
                element.calendarcontent.style.marginLeft = defaultCalendarMarginLeft - width * (1 - Math.pow(1 - percent, 4)) + 'px';
            },function(){
                element.calendarcontent.style.marginLeft = '';
                callback();
                me._status.anm = false;
            },function(){
                width = element.calendarcontent.offsetWidth / opts.numberOfMonths * opts.stepMonths;
                me._status.anm = true;
            });


            if( this._fx ){
                this._fx.add( timer );
            }else{
                this._fx = timer;
                timer.start();
            }


        }else{
            callback();
        }

    };

    Datepicker.prototype.onPrevClick = function(){
        if( !this._status.pm || this._status.anm )
            return;

        var me = this,
            opts = this._opts,
            element = this.element,
            status = this._status;

        var callback = function(){
            onPrevClick.call( me );
        };


        if( opts.stepAnimation ){

            var width = 0,
                defaultCalendarMarginLeft = this._status.defaultCalendarMarginLeft;

            var timer = new Timer( element.wrapper , opts.stepAnimation , function( percent ){
                element.calendarcontent.style.marginLeft = defaultCalendarMarginLeft - width * Math.pow(1-percent, 4)+ 'px';
            },function(){
                element.calendarcontent.style.marginLeft = '';
                me._status.anm = false;
            },function(){
                me._status.anm = true;
                width = element.calendarcontent.offsetWidth / opts.numberOfMonths * opts.stepMonths;
                callback();
                element.calendarcontent.style.marginLeft = defaultCalendarMarginLeft - width + 'px';
            });


            if( this._fx ){
                this._fx.add( timer );
            }else{
                this._fx = timer;
                timer.start();
            }


        }else{
            callback();
        }
    };

})(window , XDatepicker );
