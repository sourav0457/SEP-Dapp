App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    // App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('StudentEventPlannerBallot.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    console.log(data);
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);
    
    // App.getChairperson();
    App.render();
    return App.bindEvents();
  });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-category-count', App.getCategoryCount);
    $(document).on('click', '#add-category-btn', function(){ var value = $('#add-category-name').val(); App.addNewCategory(value); });
    $(document).on('click', '#add-event-btn', function(){ var eventName = $('#add-event-name').val(); var categoryId = $('#category-id').val(); App.addNewEvent(eventName, categoryId); });
    $(document).on('click', '#add-month-btn', function(){ var monthValue = $('#add-month-number').val(); App.addNewMonth(monthValue); });
    $(document).on('click', '#get-winner', function(){ var categoryResultId = $('#category-result-id').val(); App.getWinner(categoryResultId);});
    $(document).on('click', '.btn-vote', App.handleVote)
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
      });
    });
  },

  getChairperson : function(){
    App.contracts.vote.deployed().then(function(instance) {
      return instance;
    }).then(function(result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      if(App.chairPerson != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    })
  },

  getCategoryCount : function(){
    var categoryCountInstance;
    App.contracts.vote.deployed().then(function(instance) {
      categoryCountInstance = instance;
      console.log(instance);
      console.log(categoryCountInstance.getTotalCategoryCount());
      return categoryCountInstance.getTotalCategoryCount();
    }).then(function(result, err) {
      if(result){
        console.log(result.toNumber());
      }
    })
  },

  addNewCategory: function(value){
    var addInstance;
    App.contracts.vote.deployed().then(function(instance) {
      addInstance = instance;
      console.log(value);
      return addInstance.addCategory(value);
    }).then(function(result, err){
      console.log(result)
        if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(value + " added successfully")
          else
          alert(value + " could not be added due to revert")
        } else {
          alert(value + " addition failed")
        }   
        App.render();
      });
  },

  addNewEvent: function(eventName, categoryId){
    var addInstance;
    App.contracts.vote.deployed().then(function(instance) {
      addInstance = instance;
      console.log("Event Name: " + eventName);
      console.log("Category ID: " + categoryId);
      return addInstance.addEvent(eventName, categoryId);
    }).then(function(result, err){
        if(result){
          console.log("Event Result: " + result);
          if(parseInt(result.receipt.status) == 1)
          alert(eventName + " added successfully")
          else
          alert(eventName + " could not be added due to revert")
        } else {
          alert(eventName + " addition failed")
        }
        App.render();
      });
  },

  addNewMonth: function(monthValue){
    var addInstance;
    App.contracts.vote.deployed().then(function(instance) {
      addInstance = instance;
      console.log(monthValue);
      return addInstance.addMonth(monthValue);
    }).then(function(result, err){
        if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(monthValue + " added successfully")
          else
          alert(monthValue + " could not be added due to revert")
        } else {
          alert(monthValue + " addition failed")
        }
        App.render();   
      });
  },

  
  render: function(){
    console.log("Inside Render Function");
    var fetchInstance;
    var categoryDict = {}
    App.contracts.vote.deployed().then(function(instance) {
      fetchInstance = instance;
      return fetchInstance.categoryCount();
    }).then(function(categoryCount){
        for(var i=1; i <= categoryCount; i++){
          fetchInstance.categories(i).then(function(category) {
            categoryDict[category[0]] = category[1];
          })
        }
        console.log(categoryDict);
        App.contracts.vote.deployed().then(function(eventInstance) {
          fetchInstance = eventInstance;
          return fetchInstance.eventCount();
        }).then(function(eventCount){
          var votingContainer = $('#voting-container')
          votingContainer.empty()
          console.log("Inside eventCount");
          for(var c = 1; c <= categoryCount; c++){
            console.log("C-value" + c);
            fetchInstance.categories(c).then(function(category){
              var cid = category[0].toNumber();
              var cname = category[1];
              var categoryTemplate = document.createElement('div');
              categoryTemplate.className += 'col-md-3 border border-dark rounded pl-lg-3 py-lg-3';
              categoryTemplate.id = 'categoryTemplate' + cid;
              votingContainer.append(categoryTemplate);

              var categoryTemplateContainer = $('#categoryTemplate' + cid)
              var categoryHeader = document.createElement('div');
              categoryHeader.className += 'text-center font-weight-bold pl-lg-3 py-lg-3';
              categoryHeader.innerHTML = cname;
              // var categoryHeader = '<div class="text-center font-weight-bold pl-lg-3 py-lg-3">' + cname + '</div>'
              categoryTemplateContainer.append(categoryHeader);
              for(var e = 1; e<= eventCount; e++){
                fetchInstance.events(e).then(function(event) {
                  if(event[2].toNumber() == cid) {
                    console.log("Category Id: " + event[2].toNumber() + " Event Name:" + event[1] + " Event Id:" + event[0]);
                    var eventContent = '\
                    <div class="card pl-lg-3 bg-white mb-3" style="max-width: 20rem;">\
                      <div class="card-body align-self-start" style="width: 100%">\
                        <label class="form-check-label">' + event[1] + '</label>\
                        <button type="button" style="float: right" class="btn btn-dark btn-vote align-self-right" data-id ='+ event[0].toNumber() +'>Vote</button>\
                      </div>\
                    </div>'
                    categoryTemplateContainer.append(eventContent);
                  }
                })
              }
              votingContainer.append('<div class="px-lg-2"></div>');
              console.log("NEXT");
            })
          }
        })
      });
  },

  handleRegister: function(addr){

    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.register(addr);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(addr + " registration done successfully")
            else
            alert(addr + " registration not done successfully due to revert")
        } else {
            alert(addr + " registration failed")
        }   
    });
  },


  handleVote: function(event) {
    var voteInstance;
    event.preventDefault();
    var proposalId = parseInt($(event.target).data('id'));
    console.log("Selected Event is: " + proposalId);
    web3.eth.getAccounts(function(error, accounts){
      var account = accounts[0];
      App.contracts.vote.deployed().then(function(instance){
        voteInstance = instance;
        return voteInstance.voteEvent(proposalId, {from: account});
      }).then(function(result, error){
        if(result){
          console.log(result);
          if(parseInt(result.receipt.status) == 1)
              alert(account + " voting done successfully")
              else
              alert(account + " voting not done successfully due to revert")
          } else {
              alert(account + " voting failed")
        }
      })
    })
  },

  getWinner: function(categoryResultId) {
    var resultInstance;
    App.contracts.vote.deployed().then(function(instance) {
      resultInstance = instance;
      console.log(categoryResultId);
      return resultInstance.requestWinningEvent(categoryResultId);
    }).then(function(value){
      console.log(value);
      alert(value + " is the winner!!");
    })
  },

  handleWinner : function() {
    console.log("To get winner");
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqWinner();
    }).then(function(res){
    console.log(res);
      alert(App.names[res] + "  is the winner ! :)");
    }).catch(function(err){
      console.log(err.message);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
