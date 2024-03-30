var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var addPointToTopic = function(point){
        stompClient.send("/topic/newpoint", {}, JSON.stringify(point));
    };

    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
    
        // Conectar y suscribirse al tópico /topic/newpoint cuando la conexión sea exitosa
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (event) {
                var eventBody = JSON.parse(event.body);
                var point = new Point(eventBody.x, eventBody.y);
                addPointToCanvas(point); // Dibuja el punto en el canvas en vez de mostrar una alerta
            });
        });
    };
    
    

    return {

        init: function () {
            var can = document.getElementById("canvas");
            // Captura de eventos de click en el canvas
            can.addEventListener("click", function(evt) {
                var mousePos = getMousePosition(evt);
                app.publishPoint(mousePos.x, mousePos.y);
            });
            // Conexión WebSocket
            connectAndSubscribe();
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            addPointToTopic(pt);
            //publicar el evento
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();