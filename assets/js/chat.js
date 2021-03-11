var checkout = {};

$(document).ready(function() {

    $('#blah').hide()

    // **********************
    // Part 1: Upload photos 
    // **********************

    // Get uploaded file
    const inputElement = document.getElementById("myFile");
    inputElement.addEventListener("change", handleFiles, false);
    photofile = null
    function handleFiles() {
        const fileList = this.files; /* now you can work with the file list */
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#blah')
                .attr('src', e.target.result)
                .width($(window).width() * .15)
                .show();
                // .height(180);
            // document.getElementById("blah").style.display = "initial";
            
        };

        reader.readAsDataURL(fileList[0]);
        photofile = reader.result
        console.log(fileList[0].name)
        console.log(atob(photofile))
    }

    // Display captions already inputted
    document.getElementById("submitlabels").onclick = function() {
        console.log("activated!")
        //First things first, we need our text:
        var text = document.getElementById("input_labels").value; //.value gets input values
    
        //Now construct a quick list element
        var list_item = document.createElement('li'); // is a node
        list_item.innerHTML = text;
    
        //Now use appendChild and add it to the list!
        document.getElementById("list").appendChild(list_item);
    }

    // Package captions and submit to API Gateway
    document.getElementById("submitphoto").onclick = function() {
        // Grab photo
        photo = document.getElementById("myFile").files[0]
        filename = photo.name
        console.log("You uploaded file name" + photo.name)
        var reader = new FileReader()
        processed_photo = reader.readAsDataURL(photo)
        processed_photo = reader.result

        // var reader = new FileReader();

        // reader.onload = function (e) {
        //     $('#blah2')
        //         .attr('src', e.target.result)
        //         .width($(window).width() * .15);
        //         // .height(180);
        // };

        // reader.readAsDataURL(fileList[0]);
        labels = [];
        list = document.getElementById("list").getElementsByTagName('li');
        for(var i=0;i < list.length; i++) {
            // var arrValue = list[i].innerHTML;
            // alert(arrValue);
            labels.push(list[i].innerHTML);
        }
        console.log(labels)

        // Package as header and send to aws below
        // upload_to_AWS(photo, labels, filename)

        // Use S3 ManagedUpload class as it supports multipart uploads
        var albumBucketName = "coms6998-sp21-photobucket";
        var bucketRegion = "us-east-1";
        var IdentityPoolId= "us-east-1:a2d97868-aa4e-480e-9c50-669411afd088";

        AWS.config.update({
            region: bucketRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IdentityPoolId
            })
        });

        var s3 = new AWS.S3({
            apiVersion: "2006-03-01",
            params: { Bucket: albumBucketName }
        });

        var upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: "coms6998-sp21-photobucket",
                Key: filename,
                Body: photo
            }
        });

        var promise = upload.promise();

        promise.then(
            function(data) {
                alert("Successfully uploaded photo.");
                    viewAlbum(albumName);
                    },
                function(err) {
                return alert("There was an error uploading your photo: ", err.message);
            }
        );
    }

    // **********************
    // Part 2: Search photos 
    // ********************** 

    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
  
    // Set up error handlers
    var speech = []
    var diagnostic = document.querySelector('.output');
    recognition.onnomatch = function(event) {
        diagnostic.textContent = 'I didnt recognize that color.';
      }
    recognition.onerror = function(event) {
        diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
      }

    document.getElementById("Start").onclick = function(){
        recognition.start()
    }

    document.getElementById("Stop").onclick = function(){
        recognition.stop()
    }

    recognition.onspeechend = function() {
        recognition.stop();
        console.log(speech[speech.length-1])
        extracted_text = speech[speech.length-1]
        //Now construct a quick list element
        var list_item = document.createElement('li'); // is a node
        list_item.innerHTML = extracted_text;
        document.getElementById("transcribed_speech").appendChild(list_item);
    }

    recognition.onresult = function(event) {
        speech.push(event["results"][0][0]["transcript"])
        // console.log(event["results"][0][0]["transcript"])
    }

    // document.getElementById("Stop").onclick = function(){
    //     console.log("Ended recording")
    //     mediaRecorder.stop()
    // }

    // Handle Speech Search
    document.getElementById("submitspeech").onclick = function() {
        extracted_text = speech[speech.length-1]
        search_from_AWS(extracted_text)
        
    }

    // Handle Text Search
    document.getElementById("submitsearch").onclick = function() {
        extracted_text = document.getElementById("search_terms").value
        search_from_AWS(extracted_text)
    }

    // **********************
    // Helper Functions:
    // ********************** 

    // Main Driver for uploading to AWS
    function upload_to_AWS(photo, labels, filename){
        // TODO:
        console.log(photo)
        bucket = 'coms6998-sp21-photobucket'
        response = sdk.uploadPut({"Content-Type":"image/jpg", labels:labels, item:filename},{
            body:photo
        },{})
        console.log("Response from API Gateway:" + response)
    }

    // Driver for searching from AWS
    function search_from_AWS(extracted_text){
        console.log("About to send speech off: " + extracted_text)
        // TODO: Format properly
        response = sdk.searchGet({q:extracted_text},{
            body:extracted_text
        },{})
        console.log("Response from API Gateway:")
        response.then(function(result) {
            labels = result["data"]["Links"]
            for(var i=0;i < labels.length; i++) {
                // var arrValue = list[i].innerHTML;
                // alert(arrValue);
                appendImage(labels[i])
            }
         })

    }

    // Helper for extracting search results returned from API Gateway
    // appendImage("https://coms6998-sp21-photobucket.s3.amazonaws.com/img004.jpg")
    function appendImage(photo){
        var img = $('<img id="dynamic">'); //Equivalent: $(document.createElement('img'))
        img.attr('src', photo);
        img.appendTo('#ResultsSection');
    }

    // AWS Upload from sdk
    var albumBucketName = "BUCKET_NAME";
    var bucketRegion = "REGION";
    var IdentityPoolId = "IDENTITY_POOL_ID";

    AWS.config.update({
        region: bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        })
    });

    var s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: albumBucketName }
    });

    // AWS Upload photo straight to album
    function addPhoto(albumName) {
        var files = document.getElementById("photoupload").files;
        if (!files.length) {
          return alert("Please choose a file to upload first.");
        }
        var file = files[0];
        var fileName = file.name;
        var albumPhotosKey = encodeURIComponent(albumName) + "/";
      
        var photoKey = albumPhotosKey + fileName;
      
        // Use S3 ManagedUpload class as it supports multipart uploads
        var upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: albumBucketName,
            Key: photoKey,
            Body: file
          }
        });
      
        var promise = upload.promise();
      
        promise.then(
          function(data) {
            alert("Successfully uploaded photo.");
            viewAlbum(albumName);
          },
          function(err) {
            return alert("There was an error uploading your photo: ", err.message);
          }
        );
      }

// OLD
  function callChatbotApi(message) {
    // params, body, additionalParams
    return sdk.chatbotPost({}, {
      messages: [{
        type: 'unstructured',
        unstructured: {
          text: message
        }
      }]
    }, {});
  }

  function insertMessage() {
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
      return false;
    }
    $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setDate();
    $('.message-input').val(null);
    updateScrollbar();

    callChatbotApi(msg)
      .then((response) => {
        console.log(response);
        var data = response.data;

        if (data.messages && data.messages.length > 0) {
          console.log('received ' + data.messages.length + ' messages');

          var messages = data.messages;

          for (var message of messages) {
            if (message.type === 'unstructured') {
              insertResponseMessage(message.unstructured.text);
            } else if (message.type === 'structured' && message.structured.type === 'product') {
              var html = '';

              insertResponseMessage(message.structured.text);

              setTimeout(function() {
                html = '<img src="' + message.structured.payload.imageUrl + '" witdth="200" height="240" class="thumbnail" /><b>' +
                  message.structured.payload.name + '<br>$' +
                  message.structured.payload.price +
                  '</b><br><a href="#" onclick="' + message.structured.payload.clickAction + '()">' +
                  message.structured.payload.buttonLabel + '</a>';
                insertResponseMessage(html);
              }, 1100);
            } else {
              console.log('not implemented');
            }
          }
        } else {
          insertResponseMessage('Oops, something went wrong. Please try again.');
        }
      })
      .catch((error) => {
        console.log('an error occurred', error);
        insertResponseMessage('Oops, something went wrong. Please try again.');
      });
  }
});

//   $(window).load(function() {
//     $messages.mCustomScrollbar();
//     insertResponseMessage('Hi there, I\'m your personal Concierge. How can I help?');
//   });

//   function updateScrollbar() {
//     $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
//       scrollInertia: 10,
//       timeout: 0
//     });
//   }

//   function setDate() {
//     d = new Date()
//     if (m != d.getMinutes()) {
//       m = d.getMinutes();
//       $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
//     }
//   }


//   $('.message-submit').click(function() {
//     insertMessage();
//   });

//   $(window).on('keydown', function(e) {
//     if (e.which == 13) {
//       insertMessage();
//       return false;
//     }
//   })

//   function insertResponseMessage(content) {
//     $('<div class="message loading new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure><span></span></div>').appendTo($('.mCSB_container'));
//     updateScrollbar();

//     setTimeout(function() {
//       $('.message.loading').remove();
//       $('<div class="message new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure>' + content + '</div>').appendTo($('.mCSB_container')).addClass('new');
//       setDate();
//       updateScrollbar();
//       i++;
//     }, 500);
//   }


