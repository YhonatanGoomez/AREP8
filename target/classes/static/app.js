var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
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

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function (drawingId) {
        if (!drawingId) {
            alert('Por favor, ingrese un identificador de dibujo válido.');
            return;
        }
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            var topic = '/topic/newpoint.' + drawingId;
            console.log('Subscribing to ' + topic);
            stompClient.subscribe(topic, function (event) {
                var eventBody = JSON.parse(event.body);
                var point = new Point(eventBody.x, eventBody.y);
                addPointToCanvas(point); // Dibuja el punto en el canvas
            });
        });
    };

    return {
        init: function () {
            // Evento de click en el canvas solo preparado, sin conexión automática
            var can = document.getElementById("canvas");
            can.addEventListener("click", function(evt) {
                if (stompClient !== null && stompClient.connected) {
                    var mousePos = getMousePosition(evt);
                    app.publishPoint(mousePos.x, mousePos.y);
                } else {
                    alert("Por favor, conectarse a un ID de dibujo primero.");
                }
            });
        },

        publishPoint: function(px, py) {
            var drawingId = document.getElementById("drawingId").value; // Obtiene el ID del dibujo.
            var pt = new Point(px, py);
            console.info("publishing point at " + pt + " in drawing " + drawingId);
            addPointToCanvas(pt);
            if (stompClient && stompClient.connected) {
                stompClient.send("/app/newpoint." + drawingId, {}, JSON.stringify(pt));
            } else {
                alert("No está conectado. Por favor, conectarse a un dibujo primero.");
            }
        },

        connectAndSubscribe: connectAndSubscribe,

        isConnected: function() {
            
            return stompClient !== null && stompClient.connected;
        },
        getMousePosition: getMousePosition
    };

})();
