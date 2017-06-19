angular.module('bidApp',[])
    .directive('playerstat',function(){
        var directive = {};
        directive.restrict = 'E';
        directive.template =
            "<div ng-show='playerstat' class='playerstatMain'>" +
                "<div class='playerstatHead'>Player Stats</div>" +
                "<div class='playerstatData'>" +
                     "Name : {{playerstat.name}}<br>" +
                     "Coins left: {{playerstat.coins}}<br>" +
                     "<button ng-click='logout()'>Leave</button>" +
               "</div>" +
            "</div>";
        directive.scope = {
            playerstat : "=name"
        }

        directive.compile = function(element, attributes) {
            var linkFunction = function($scope, element, attributes) {
                $scope.logout = function () {
                    sessionStorage.clear();
                    location.reload();
                };
                // element.html("Student: <b>"+$scope.playerstat.name +"</b> , Roll No: <b>"+$scope.playerstat.rollno+"</b><br/>");
                // element.html("");
                // element.css("background-color", "#ff00ff");
            }
            return linkFunction;
        }
        return directive;
    })
    .directive('inventory',function($http){
        var directive = {};
        directive.restrict = 'E';
        directive.template =
            "<div ng-show='inventory' class='inventoryMain'>" +
                "<div class='inventoryHead'>Inventory</div>" +
                "<div class='inventoryData'>" +
                    "<div class='inventoryItem' ng-repeat='x in inventory.items'>" +
                        "<img ng-src='/images/{{x.name}}.png' title='{{x.name}}' alt='{{x.name}}' /> {{x.quantity}}" +
                        "<button ng-click='auctionIt(x.name,x.quantity)'>Auction</button>" +
                    "</div>" +
                "</div>" +
            "</div>";
        directive.scope = {
            inventory : "=name"
        }
        directive.compile = function(element, attributes) {
            var linkFunction = function($scope, element, attributes) {
                $scope.auctionIt = function(name,quantity){
                    console.log(name,quantity);
                    swal({
                        title: 'Choose necessary',
                        html:
                        '<input id="swal-input1" placeholder="Enter quantity" class="swal2-input" autofocus>' +
                        '<input id="swal-input2" placeholder="Enter bid value" class="swal2-input">',
                        showCancelButton: false,
                        allowEscapeKey:false,
                        allowOutsideClick:false,
                        confirmButtonText: 'Start Auction',
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        preConfirm: function() {
                            return new Promise(function(resolve,reject) {
                                console.log(quantity);
                                var qty = document.getElementById('swal-input1').value;
                                var bid = document.getElementById('swal-input2').value;
                                if (qty > quantity) {
                                    reject('Quantity can\'t be greater than available items.');
                                } else {
                                    resolve([qty,bid]);
                                }
                            });
                        }
                    }).then(function(result) {
                        // swal(result[0]);
                        $http({url:'/api/startAuction',method:'post',data:{name:name,qty:result[0],bid:result[1]},headers:{user:sessionStorage.getItem('user'), token:sessionStorage.getItem('token')}})
                            .success(function(data,status){
                                if (status == 200) {
                                    if(data && data.status == 401){
                                        swal({
                                            type: 'error',
                                            title: 'You are not authorised!',
                                            html: 'Login Again'
                                        });
                                        sessionStorage.clear();
                                        location.reload();
                                    }else if(data && data.status == 1){
                                        swal({
                                            type: 'success',
                                            title: 'Congratulations',
                                            html: 'Auction has started.'
                                        });
                                    }else{
                                        swal({
                                            type: 'error',
                                            title: 'Auction is already running.',
                                            html: 'Please wait for sometime.'
                                        });
                                    }
                                } else {
                                    swal({
                                        type: 'error',
                                        title: 'Something went wrong!',
                                        html: 'Refresh the page.'
                                    });
                                }
                            })
                            .error(function(a,b,c,d){
                                swal({
                                    type: 'error',
                                    title: 'Something went wrong!',
                                    html: 'Refresh the page.'
                                });
                            });
                    })
                };
            }
            return linkFunction;
        }
        return directive;
    })
    .directive('auction',function($http){
        var directive = {};
        directive.restrict = 'E';
        directive.template =
            "<div class='auctionMain'>" +
                "<div class='auctionHead'>Current Auction</div>" +
                "<div class='auctionData'>" +
                    "<div ng-show='auction'>" +
                        "Seller Name:{{auction.sellerName}}<br>" +
                        "Item : {{auction.itemName}} - {{auction.quantity}}<br>" +
                        "Time Left:{{auction.timeLeft}}<br>" +
                        "Winning Bid :{{auction.winningBid}}" +
                        "<input ng-model='price' type='number' />" +
                        "<button ng-click='bid()'>Place Bid</button>" +
                    "</div>" +
                "<div ng-show='!auction'>No auction at the moment.</div></div>" +
            "</div>";
        directive.scope = {
            auction : "=name"
        }
        directive.compile = function(element, attributes) {
            var linkFunction = function($scope, element, attributes) {
                $scope.bid = function(){
                    if($scope.price < $scope.auction.winningBid){
                        swal({
                            type: 'error',
                            title: 'Invalid price.',
                            html: 'Bid price should be greater than minimum bid.'
                        });
                        return;
                    }
                    $http({url:'/api/bid',method:'post',data:{id:$scope.auction.id,price:$scope.price},headers:{user:sessionStorage.getItem('user'), token:sessionStorage.getItem('token')}})
                        .success(function(data,status){
                            if (status == 200) {
                                if(data && data.status == 401){
                                    swal({
                                        type: 'error',
                                        title: 'You are not authorised!',
                                        html: 'Login Again'
                                    });
                                    sessionStorage.clear();
                                    location.reload();
                                }else if(data && data.status == 1){
                                    swal({
                                        type: 'success',
                                        title: 'Congratulations',
                                        html: 'Bid successful.'
                                    });
                                    $scope.price = '';
                                }else{
                                    swal({
                                        type: 'error',
                                        title: 'Sorry!',
                                        html: 'Auction has been closed.'
                                    });
                                }
                            } else {
                                swal({
                                    type: 'error',
                                    title: 'Something went wrong!',
                                    html: 'Refresh the page.'
                                });
                            }
                        })
                        .error(function(a,b,c,d){
                            swal({
                                type: 'error',
                                title: 'Something went wrong!',
                                html: 'Refresh the page.'
                            });
                        });
                };
            }
            return linkFunction;
        }
        return directive;
    })
    .controller('bidCtrl',function($scope,$http,$interval){
        function initPage(text){
            $http({url:'/api/login',method:'post',data:{name:text}})
                .success(function(data,status){
                    if (status == 200 && data && data.status == 1) {
                        if(!sessionStorage.getItem('token') || !sessionStorage.getItem('user')){
                            swal({
                                type: 'success',
                                confirmButtonText:'Bid Now',
                                title: 'Login Successfully!',
                                html: 'Welcome ' + data.data.name
                            });
                        }
                        $scope.showPage = true;
                        $scope.playerInfo = {
                            name:data.data.name,
                            coins:data.data.coins
                        };
                        $scope.inventoryInfo = {
                            items : [
                                {
                                    name:"Diamond",
                                    quantity:data.data.Diamond
                                },
                                {
                                    name:"Bread",
                                    quantity:data.data.Bread
                                },
                                {
                                    name:"Carrot",
                                    quantity:data.data.Carrot
                                }
                            ]
                        };
                        if(data.data.auction){
                            $scope.auctionInfo = {
                                id:data.data.auction.bid_id,
                                sellerName:data.data.auction.seller,
                                itemName:data.data.auction.item_name,
                                quantity:data.data.auction.qty,
                                timeLeft:(90 - (new Date().valueOf()-data.data.auction.starting_time)/1000).toFixed(0),
                                winningBid:data.data.auction.min_bid
                            };
                            $scope.clock = $interval(function(){
                                $scope.auctionInfo.timeLeft--;
                                if($scope.auctionInfo.timeLeft < 1){
                                    $interval.cancel($scope.clock);
                                    delete $scope.auctionInfo;
                                }
                            },1000);
                            $scope.$watch('auctionInfo.sellerName',function(){
                                console.log($scope.auctionInfo.timeLeft);
                            });
                        }
                        sessionStorage.setItem('token',data.data.token)
                        sessionStorage.setItem('user',data.data.name)
                    } else {
                        swal({
                            type: 'error',
                            title: 'Something went wrong!',
                            html: 'Refresh the page.'
                        });
                    }
                }).error(function(a,b,c,d){
                swal({
                    type: 'error',
                    title: 'Something went wrong!',
                    html: 'Refresh the page.'
                });
            });
        };
        if(!sessionStorage.getItem('token') || !sessionStorage.getItem('user')){
            swal({
                title: 'Enter User Name',
                input: 'text',
                inputPlaceholder:'Enter Your Name',
                inputAutoTrim:true,
                showCancelButton: false,
                allowEscapeKey:false,
                allowOutsideClick:false,
                confirmButtonText: 'Login',
                showLoaderOnConfirm: true,
                preConfirm: function(text) {
                    return new Promise(function(resolve, reject) {
                            if (!text) {
                                reject('Please enter your name');
                            } else {
                                resolve();
                            }
                    });
                },
            }).then(function(text) {
                initPage(text);
            });
        }else{
            initPage(sessionStorage.getItem('user'));
        }
    });