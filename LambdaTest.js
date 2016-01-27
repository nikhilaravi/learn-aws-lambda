console.log('Loading event');
console.log('Loading event again');

exports.handler = function(event, context) {
    console.log("EVENT", event.key1);
    context.succeed(event.key1);  // SUCCESS with message
};
