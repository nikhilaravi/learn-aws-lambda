console.log('Loading event');
console.log('Loading event again');

exports.handler = function(event, context) {
    console.log("UPDATED");
    context.succeed(event.key1);  // SUCCESS with message
};
