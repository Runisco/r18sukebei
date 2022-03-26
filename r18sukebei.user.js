// ==UserScript==
// @name         r18sukebei
// @namespace    https://github.com/Runisco
// @version      1.0
// @updateURL https://github.com/Runisco/r18sukebei/raw/main/r18sukebei.user.js
// @downloadURL https://github.com/Runisco/r18sukebei/raw/main/r18sukebei.user.js
// @supportURL https://github.com/Runisco/r18sukebei/issues
// @description  Links r18 with sukebei
// @author       Runisco
// @match        https://www.r18.com*
// @match www.r18.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=r18.com
// @grant GM_xmlhttpRequest
// @require http://code.jquery.com/jquery-latest.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @connect sukebei.nyaa.si
// ==/UserScript==

waitForKeyElements (".cart-wrapper", actionFunction);

function isNum(i) {
    return (i >= '0' && i <= '9');
}

function actionFunction(){
    jQuery(function ($) {
        var reLeadingNumbers = /\d+/;
        var movieIdLeading;
        var sukebeiSearch = "https://sukebei.nyaa.si/?f=0&c=0_0&q="

        // First find the movie ID so search is possible
        var rawMovieId = $('div.contents_rental').find('div.js-add-to-cart').attr('data-content-id');
        console.log("first movie id found: " + rawMovieId);
        // Cleanup the movie ID to remove leading numbers, and trailing garbage.
        // Remove all numbers before the first letter
        if (isNum(rawMovieId.charAt(0))){
            movieIdLeading = rawMovieId.replace(reLeadingNumbers, "");
            console.log("Tried to remove multiple numbers at beginning of ID: " + movieIdLeading);
        } else {
            movieIdLeading = rawMovieId;
        };
        // If the movie ID has d16 in it, remove it
        if (movieIdLeading.includes('d16')){
            movieIdLeading = movieIdLeading.replace("d16","");
            console.log("Removed 'd16' from title: " + movieIdLeading);
        };
        // sometimes the id numbers contain "1000" before, try to replace it
        if (movieIdLeading.includes("000")){
            movieIdLeading = movieIdLeading.replace("000","");
            console.log("Tried to remove '000' from id: " + movieIdLeading);
        };
        // JAV IDs are usually 3 numbers at the end i.e KAR-544. If the number we end up with is less, we need to pad it first.
        var splitId = movieIdLeading.split(/(\d+)/);
        var movieIdLetters = splitId[0];
        var movieIdNumbers = parseInt(splitId[1]) * 1;
        console.log("Id is now split.\nID Letters: " + movieIdLetters + "\nID Numbers: " + movieIdNumbers);
        var properMovieIdNumbers = ('0000'+movieIdNumbers).slice(-3);
        console.log("Padded the ID number to three digits: " + properMovieIdNumbers);

        // Setup the entrypoint and button codes
        var entryPoint = $('.cart-wrapper').find('div.js-add-to-wishlist')
        var searchText = $('<div class="sukebeiSpacer"><div class="sukebei"><a href="' + sukebeiSearch + movieIdLetters + '-' + properMovieIdNumbers + '" target="_blank"><span class="sukebeiSearch">Search on Sukebei</span></div></div>')
        var downloadButtons = $('<div class="wrapper"></div>');
        var torrentGet = $('<a href="#" class="button--link button rippleButton" ID="download"><span>Try downloading</span></a>');
        searchText.insertAfter(entryPoint)
        torrentGet.insertAfter(searchText);
        downloadButtons.insertAfter(torrentGet);
        $("div.sukebeiSpacer").css({'padding-top': '15px'});
        $("div.sukebei").css({'padding': '10px', 'background-color': '#f44336', 'border-radius': '8px'});
        $('span.sukebeiSearch').css({'font-weight': 'bold'});
        $('div.wrapper').css({'width':'100%', 'display': 'inline', 'word-wrap': 'normal'});


        $(document).on("click", "#download", function (e) {
            torrentGet.text("Standby, searching.")
            new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    headers: { 'Referer': sukebeiSearch + movieIdLetters + '-' + properMovieIdNumbers },
                    url: sukebeiSearch + movieIdLetters + '-' + properMovieIdNumbers,
                    method: "GET",
                    responseType: 'document',
                    onload: function (response) {
                        var requestResponse = response.response;

                        var goodTorrentTable = requestResponse.getElementsByClassName("success");
                        var regularTorrentTable = requestResponse.getElementsByClassName("default");
                        console.log(regularTorrentTable);



                        for (let i = 0; i < goodTorrentTable.length; i++) {
                            var infoSlots = goodTorrentTable[i].getElementsByClassName("text-center");
                            for (let y = 0; y < infoSlots.length; y++) {
                                if (y == 0){
                                    var magnetLink = infoSlots[y].querySelector('a:last-child')
                                    console.log("This should be the magnet link: " + magnetLink);
                                }
                                else if (y == 1){
                                    var sizeInfo = infoSlots[y].innerHTML
                                    console.log("This should be the size info: " + sizeInfo)
                                }
                                else if (y == 3){
                                    var seederInfo = infoSlots[y].innerHTML
                                    console.log("This should be the seeder info: " + seederInfo)
                                }
                                else if (y == 4){
                                    var leechInfo = infoSlots[y].innerHTML
                                    console.log("This should be the leech info: " + leechInfo)
                                };
                            };

                            var formattedText = $('<div class="sukebeiGoodLink"><a href="' + magnetLink + '"><span>' + sizeInfo + ' - ' + seederInfo + '|' + leechInfo +'</span></a></div>  ');
                            //formattedText.insertAfter(searchText)
                            downloadButtons.append(formattedText)
                            $('div.sukebeiGoodLink').css({'background-color': '#4CAF50', 'width': '23%', 'display': 'inline-block', 'margin-right': '2px', 'margin-bottom': '2px'});
                        }


                        var regularLinks = []
                        for (let i = 0; i < regularTorrentTable.length; i++) {
                            var infoSlots = regularTorrentTable[i].getElementsByClassName("text-center");
                            for (let y = 0; y < infoSlots.length; y++) {
                                if (y == 0){
                                    var magnetLink = infoSlots[y].querySelector('a:last-child')
                                    console.log("This should be the magnet link: " + magnetLink);
                                }
                                else if (y == 1){
                                    var sizeInfo = infoSlots[y].innerHTML
                                    console.log("This should be the size info: " + sizeInfo)
                                }
                                else if (y == 3){
                                    var seederInfo = infoSlots[y].innerHTML
                                    console.log("This should be the seeder info: " + seederInfo)
                                }
                                else if (y == 4){
                                    var leechInfo = infoSlots[y].innerHTML
                                    console.log("This should be the leech info: " + leechInfo)
                                };
                            };

                            var formattedText = $('<div class="sukebeiRegularLink"><a href="' + magnetLink + '"><span>' + sizeInfo + ' - ' + seederInfo + '|' + leechInfo +'</span></a></div>          ');
                            //formattedText.insertAfter(searchText)
                            downloadButtons.append(formattedText)
                            regularLinks.push(formattedText)
                            //console.log(typeof regularLinks);
                            //for(var x = 0; x < regularLinks.length; x+=3) {
                            //    downloadButtons.append(regularLinks.slice(x, x+4).wrapAll("<div class='sukebeiRegularLink'></div>"));
                            //}
                            $('div.sukebeiRegularLink').css({'background-color': '#e7e7e7', 'width': '23%', 'display': 'inline-block', 'margin-right': '2px', 'margin-bottom': '2px'});
                        };
                        if (goodTorrentTable.length == 0 && regularTorrentTable.length == 0){
                            torrentGet.text("Found no results. Click search button above to make sure");
                        } else {
                            torrentGet.remove();
                        }
                        console.log(regularLinks);

                    }
                })
            });
        });
    })
};
