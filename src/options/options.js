   var privateKeyFormToggle = true;
   var publicKeyFormToggle = true;
   var generateKeyFormToggle = true;

   function showMessages(msg){
    console.log(msg);
   }

   function generateKeyPair(){
        $('.alert').hide();
        var form = $('#generateKeyPairForm');
        var email = form.find('#email').val();
        var keyPair = openpgp.generate_key_pair(1,parseInt(form.find('#numBits').val(), 10), form.find('#name').val() + ' <' + email + '>', form.find('#password').val());
        openpgp.keyring.importPrivateKey(keyPair.privateKeyArmored, form.find('#password').val());
        keyPair.publicKeyArmored = keyPair.publicKeyArmored.replace(/\n\s+\n=/, '\n=');
        openpgp.keyring.importPublicKey(keyPair.publicKeyArmored);
        KeyServer.post(email, keyPair.publicKeyArmored);
        openpgp.keyring.store();
        parsePrivateKeys();
        parsePublicKeys();
   }

   function insertPrivateKey(){
        $('.alert').hide();
       var privKey = $('#newPrivateKey').val();
       var privKeyPassword = $('#newPrivateKeyPassword').val();
       try{
           if(openpgp.keyring.importPrivateKey(privKey, privKeyPassword)){
            openpgp.keyring.store();
            parsePrivateKeys();
            return true;
           }
           else{
            $('#insertPrivateKeyForm').prepend('<div class="alert alert-error" id="gCryptAlertPassword">Mymail-Crypt for Gmail was unable to read your key. Is your password correct?</div>');
           }
       }
       catch(e){
       }
        $('#insertPrivateKeyForm').prepend('<div class="alert alert-error" id="gCryptAlertPassword">Mymail-Crypt for Gmail was unable to read your key. It would be great if you could contact us so we can help figure out what went wrong.</div>');
        return false;
   }

   function insertPublicKey(){
        $('.alert').hide();
        var pubKey = $('#newPublicKey').val();
        try{
            openpgp.keyring.importPublicKey(pubKey);
            openpgp.keyring.store();
            parsePublicKeys();
            return true;
        }
        catch(e){
        }
        $('#insertPublicKeyForm').prepend('<div class="alert alert-error" id="gCryptAlertPassword">Mymail-Crypt for Gmail was unable to read this key. It would be great if you could contact us so we can help figure out what went wrong.</div>');
        return false;
   }

   function parsePublicKeys(){
      var keys = openpgp.keyring.publicKeys;
      $('#publicKeyTable>tbody>tr').remove();
      for(var k=0;k<keys.length;k++){
          var key = keys[k];
          var user = gCryptUtil.parseUser(key.obj.userIds[0].text);
          $('#publicKeyTable>tbody').append(
              '<tr><td>'+user.userName+'</td>'+
              '<td>'+user.userEmail+'</td>'+
              '<td>'+util.hexstrdump(key.keyId)+'</td>'+
              '<td><a href="#public'+k+'" data-toggle="modal">Show key</a><div class="modal" id="public'+k+'">'+
                  '<a href="#" class="close" data-dismiss="modal">Close</a><br/ ><textarea>'+key.armored+'</textarea></div></td>'+
              '<td class="removeLink" id="'+k+'"><a href="#">Remove</a></td></tr>');
          $('#public'+k).hide();
          $('#public'+k).modal({backdrop: true, show: false});
      }
      $('#publicKeyTable .removeLink').click(function(e){
        openpgp.keyring.removePublicKey(e.currentTarget.id);
        openpgp.keyring.store();
        parsePublicKeys();
        });
   }

   function parsePrivateKeys(){
      var keys = openpgp.keyring.privateKeys;
      var lastKey = keys.length > 0?
          keys[keys.length - 1]: null;
      if(lastKey) {
          var pubKey = lastKey.obj.extractPublicKey();
          var keyName = lastKey.obj.userIds.length > 0? lastKey.obj.userIds[0].text: 'Unnamed key';

          $('#homeSpan .key-name').text(keyName);
          $('#homeSpan .pub-key').text(pubKey);
      }

      $('#privateKeyTable>tbody>tr').remove();
      for(var k=0;k<keys.length;k++){
          var key = keys[k];
          var user = gCryptUtil.parseUser(key.obj.userIds[0].text);
          $('#privateKeyTable>tbody').append(
              '<tr><td>'+user.userName+'</td>'+
              '<td>'+user.userEmail+'</td>'+
              '<td><a href="#private'+k+'" data-toggle="modal">Private key</a><div class="modal" id="private'+k+'">'+
                  '<a class="close" data-dismiss="modal">Close</a><br/ ><textarea>'+key.armored+'</textarea></div></td>'+
              '<td><a href="#privatepub'+k+'" data-toggle="modal">Public key</a><div class="modal" id="privatepub'+k+'">'+
                  '<a class="close" data-dismiss="modal">Close</a><br/ ><textarea>'+key.obj.extractPublicKey()+'</textarea></div></td>'+
              '<td class="removeLink" id="'+k+'"><a href="#">Remove</a></td></tr>');
          $('#private'+k).hide();
          $('#private'+k).modal({backdrop: true, show: false});
          $('#privatepub'+k).hide();
          $('#privatepub'+k).modal({backdrop: true, show: false});
      }
      $('#privateKeyTable .removeLink').click(function(e){
        openpgp.keyring.removePrivateKey(e.currentTarget.id);
        openpgp.keyring.store();
        parsePrivateKeys();
      });
   }

    /**
     * We use openpgp.config for storing our options.
     */
   function saveOptions(){
        var gCryptSettings = openpgp.config.config.gCrypt;
        if(!gCryptSettings){
            gCryptSettings = {};
        }
        if($('#stopAutomaticDrafts:checked').length == 1){
            gCryptSettings.stopAutomaticDrafts = true;
        } else {
            gCryptSettings.stopAutomaticDrafts = false;
        }
        if($('#includeMyself:checked').length == 1){
            gCryptSettings.includeMyself = true;
        } else {
            gCryptSettings.includeMyself = false;
        }
        if($('#showComment:checked').length == 1){
            openpgp.config.config.show_comment = true;
        } else {
            openpgp.config.config.show_comment = false;
        }
        if($('#showVersion:checked').length == 1){
            openpgp.config.config.show_version = true;
        } else {
            openpgp.config.config.show_version = false;
        }

        openpgp.config.config.gCrypt = gCryptSettings;
        openpgp.config.write();
   }

   function loadOptions(){
        var gCryptSettings = openpgp.config.config.gCrypt;
        if (gCryptSettings && gCryptSettings.stopAutomaticDrafts){
            $('#stopAutomaticDrafts').attr('checked', true);
        }
        if (gCryptSettings && gCryptSettings.includeMyself) {
            $('#includeMyself').attr('checked', true);
        }
        if (openpgp.config.config.show_comment){
            $('#showComment').attr('checked', true);
        }
        if (openpgp.config.config.show_version){
            $('#showVersion').attr('checked', true);
        }
   }

   function linkLocalFunction(event){
       $('.alert').hide();
       $('span').hide();
       if(event && event.currentTarget){
        $(event.currentTarget.hash).show();
       }
   }

    function searchKey(event) {
        var self = $(this);
        var email = self.find('#search_term').val();
        KeyServer.getAll(email)
        .done(function(keys){
            $.each(keys, function(i, key){
                openpgp.keyring.importPublicKey(key);
            })

            openpgp.keyring.store();
            parsePublicKeys();
        });

        event.preventDefault();
        return false;
    }

    function onLoad(){
        openpgp.init();
        parsePrivateKeys();
        parsePublicKeys();
        loadOptions();
        $('.linkLocal').click(linkLocalFunction).click();
        $('#homeSpan').show();
        $('#generateKeyPairForm').hide();
        $('#generateKeyPairTitle').click(function() {
            $('#generateKeyPairForm').toggle(generateKeyFormToggle);
            generateKeyFormToggle = !generateKeyFormToggle;
        });
        $('#insertPrivateKeyForm').hide();
        $('#insertPrivateKeyTitle').click(function() {
            $('#insertPrivateKeyForm').toggle(privateKeyFormToggle);
            privateKeyFormToggle = !privateKeyFormToggle;
        });
        $('#insertPublicKeyForm').hide();
        $('#insertPublicKeyTitle').click(function() {
            $('#insertPublicKeyForm').toggle(publicKeyFormToggle);
            publicKeyFormToggle = !publicKeyFormToggle;
        });
        $('#optionsFormSubmit').click(saveOptions);
        $('#insertPrivateKeyFormSubmit').click(insertPrivateKey);
        $('#generateKeyPairFormSubmit').click(generateKeyPair);
        $('#insertPublicKeyFormSubmit').click(insertPublicKey);
        $('#searchKey').submit(searchKey);

        $('#send-key-form').submit(function(){
            var key = $('#homeSpan .pub-key').val();
            var name = $('#homeSpan .key-name').val();
        })
      }

   $(document).ready(onLoad());
