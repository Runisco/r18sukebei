// ==UserScript==
// @name         R18 Sukebei Links
// @namespace    https://github.com/Runisco
// @version      1.1
// @updateURL https://github.com/Runisco/r18sukebei/raw/main/r18sukebei.user.js
// @downloadURL https://github.com/Runisco/r18sukebei/raw/main/r18sukebei.user.js
// @supportURL https://github.com/Runisco/r18sukebei/issues
// @description  Adds the ability to search for torrents on sukebei from r18 video pages, and trailer previews
// @author       Runisco
// @match        https://www.r18.com/common/search/searchword=*
// @match        https://www.r18.com/videos/vod/movies/detail/*
// @match www.r18.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=r18.com
// @grant GM_xmlhttpRequest
// @require https://code.jquery.com/jquery-3.5.1.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @connect sukebei.nyaa.si
// ==/UserScript==


/* globals waitForKeyElements, $, jQuery */

var sukebeiSearch = "https://sukebei.nyaa.si/?f=0&c=0_0&q=";

var debug = true;

waitForKeyElements (".cart-wrapper", trailerWindow);
waitForKeyElements ("#root", regularPage);

function isNum(i) {
    return (i >= '0' && i <= '9');
}

function cleanId(dirtyId){
    if (debug){console.log("Inside cleanId now.")};
    if (debug){console.log("Dirty ID given: " + dirtyId)};
    var reLeadingNumbers = /\d+/;
    var properMovieIdNumbers;
    if (isNum(dirtyId.charAt(0))){
        var movieIdLeading = dirtyId.replace(reLeadingNumbers, "");
        if (debug){console.log("Tried to remove multiple numbers at beginning of ID: " + movieIdLeading)};
    } else {
        movieIdLeading = dirtyId;
    };
    // If the movie ID has d16 in it, remove it
    if (movieIdLeading.includes('d16')){
        movieIdLeading = movieIdLeading.replace("d16","");
        if (debug){console.log("Removed 'd16' from title: " + movieIdLeading)};
    };
    // sometimes the id numbers contain "1000" before, try to replace it
    if (movieIdLeading.includes("000")){
        movieIdLeading = movieIdLeading.replace("000","");
        if (debug){console.log("Tried to remove '000' from id: " + movieIdLeading)};
    };
    // JAV IDs are usually 3 numbers at the end i.e KAR-544. If the number we end up with is less, we need to pad it first.
    var splitId = movieIdLeading.split(/(\d+)/);
    var movieIdLetters = splitId[0];
    var movieIdNumbers = parseInt(splitId[1]) * 1;

    if (debug){console.log("Id is now split.\nID Letters: " + movieIdLetters + "\nID Numbers: " + movieIdNumbers)};
    properMovieIdNumbers = ('0000'+movieIdNumbers).slice(-3);

    if (debug){console.log("Padded the ID number to three digits: " + properMovieIdNumbers)};

    // If the new id has a _ in it, then something went wrong, and we need to rerun the function on the remainder.
    if (movieIdLetters.includes("_") || properMovieIdNumbers.includes("_")){
        var newDirtyId = dirtyId.replace(splitId[0] + splitId[1], "")
        if (debug){console.log("Seems to be an underscore. Removing " + splitId[0] + splitId[1] + " from id and rerunning on remainder: " + newDirtyId)};
        return cleanId(newDirtyId);
    } else {
        if (debug){console.log("Returning cleaned id: " + movieIdLetters + '-' + properMovieIdNumbers)};
        return movieIdLetters + '-' + properMovieIdNumbers;
    }
}



function regularPage(){
    var goodTorrentTable = [];
    var regularTorrentTable = [];

    console.log("We're on a regular page now");
    var movieId = document.querySelector("#root > div > div > div.sc-bdnylx.jMhaxE.sc-lcuZuX.fbGAic > section:nth-child(1) > div > div > div > div.sc-cfAQHH.eoFefw.sc-ensa-Dq.dtwKLi > div > div:nth-child(6) > h3");
    console.log("Is this the movie ID?: " + movieId);
    movieId = document.URL.match(/id=(.*)\//)[1];
    console.log("Is this the right ID after cleanup from URL?: " + cleanId(movieId));
    var torrentGet = $('<section class="sc-ffgBaG loKHf"><div class="downloadLink"><a href="#" class="button--link button rippleButton" ID="download"><h2><span class="downloadText">Click to get links from Sukebei</span></h2></a></div></section>');
    var searchText = $('<div class="sukebeiSpacer"><div class="sukebei"><a href="' + sukebeiSearch + movieId + '" target="_blank"><span class="sukebeiSearch">Search on Sukebei</span></div></div>')
    var entryPoint = $('section.sc-ffgBaG');
    searchText.insertAfter(entryPoint)
    torrentGet.insertBefore(entryPoint);
    // entryPoint.append(torrentGet);
    $('.downloadText').css({'font-size': '18px', 'font-weight': '900'})
    var downloadButtons = $('<div class="wrapper"></div>');
    downloadButtons.insertAfter(torrentGet);

    $(document).on("click", "#download", function (e) {
        torrentGet.text("Standby, searching.")
        new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                headers: { 'Referer': sukebeiSearch + movieId},
                url: sukebeiSearch + movieId,
                method: "GET",
                responseType: 'document',
                onload: function (response) {
                    var requestResponse = response.response;

                    goodTorrentTable = requestResponse.getElementsByClassName("success");
                    regularTorrentTable = requestResponse.getElementsByClassName("default");
                    console.log(goodTorrentTable);
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
                    goodTorrentTable = [];
                    regularTorrentTable = [];
                    // movieIdLeading = "";
                    // rawMovieId = "";
                    // properMovieIdNumbers = "";
                    // console.log(regularLinks);

                }
            })
        });
    });
};



function trailerWindow(){
    if (debug){console.log("Detected trailer window")};
    jQuery(function ($) {
        var reLeadingNumbers = /\d+/;
        var movieIdLeading = "";
        var rawMovieId = "";
        var properMovieIdNumbers = "";
        var goodTorrentTable = [];
        var regularTorrentTable = [];

        // First find the movie ID so search is possible
        rawMovieId = $('div.contents_rental').find('div.js-add-to-cart').attr('data-content-id');
        if (debug){console.log("This is the raw movie id found from js-add-to-cart: " + rawMovieId)};

        var movieId = cleanId(rawMovieId);

        // Setup the entrypoint and button codes
        var entryPoint = $('.cart-wrapper').find('div.js-add-to-wishlist')
        if (entryPoint.length == 0){
            entryPoint = $('.cart-wrapper').find('div.cmn-in-wishlist')
        }
        // var searchText = $('<div class="sukebeiSpacer"><div class="sukebei"><a href="' + sukebeiSearch + movieIdLetters + '-' + properMovieIdNumbers + '" target="_blank"><span class="sukebeiSearch">Search on Sukebei</span></div></div>')
        var searchText = $('<div class="sukebeiSpacer"><div class="sukebei"><a href="' + sukebeiSearch + movieId + '" target="_blank"><span class="sukebeiSearch">Search on Sukebei</span></div></div>')
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
                    headers: { 'Referer': sukebeiSearch + movieId},
                    url: sukebeiSearch + movieId,
                    method: "GET",
                    responseType: 'document',
                    onload: function (response) {
                        var requestResponse = response.response;

                        goodTorrentTable = requestResponse.getElementsByClassName("success");
                        regularTorrentTable = requestResponse.getElementsByClassName("default");
                        // console.log(regularTorrentTable);

                        var infoSlots;
                        var magnetLink
                        var sizeInfo;
                        var seederInfo;
                        var leechInfo;
                        var formattedText;

                        for (let i = 0; i < goodTorrentTable.length; i++) {
                            infoSlots = goodTorrentTable[i].getElementsByClassName("text-center");
                            for (let y = 0; y < infoSlots.length; y++) {
                                if (y == 0){
                                    magnetLink = infoSlots[y].querySelector('a:last-child')
                                    console.log("This should be the magnet link: " + magnetLink);
                                }
                                else if (y == 1){
                                    sizeInfo = infoSlots[y].innerHTML
                                    console.log("This should be the size info: " + sizeInfo)
                                }
                                else if (y == 3){
                                    seederInfo = infoSlots[y].innerHTML
                                    console.log("This should be the seeder info: " + seederInfo)
                                }
                                else if (y == 4){
                                    leechInfo = infoSlots[y].innerHTML
                                    console.log("This should be the leech info: " + leechInfo)
                                };
                                magnetLink = undefined;
                                sizeInfo = undefined;
                                seederInfo = undefined;
                                leechInfo = undefined;
                                formattedText = undefined;
                            };

                            formattedText = $('<div class="sukebeiGoodLink"><a href="' + magnetLink + '"><span>' + sizeInfo + ' - ' + seederInfo + '|' + leechInfo +'</span></a></div>  ');
                            //formattedText.insertAfter(searchText)
                            downloadButtons.append(formattedText)
                            $('div.sukebeiGoodLink').css({'background-color': '#4CAF50', 'width': '23%', 'display': 'inline-block', 'margin-right': '2px', 'margin-bottom': '2px'});
                            infoSlots = undefined;
                        }


                        var regularLinks = []
                        for (let i = 0; i < regularTorrentTable.length; i++) {
                            infoSlots = regularTorrentTable[i].getElementsByClassName("text-center");
                            for (let y = 0; y < infoSlots.length; y++) {
                                if (y == 0){
                                    magnetLink = infoSlots[y].querySelector('a:last-child')
                                    console.log("This should be the magnet link: " + magnetLink);
                                }
                                else if (y == 1){
                                    sizeInfo = infoSlots[y].innerHTML
                                    console.log("This should be the size info: " + sizeInfo)
                                }
                                else if (y == 3){
                                    seederInfo = infoSlots[y].innerHTML
                                    console.log("This should be the seeder info: " + seederInfo)
                                }
                                else if (y == 4){
                                    leechInfo = infoSlots[y].innerHTML
                                    console.log("This should be the leech info: " + leechInfo)
                                };
                                magnetLink = undefined;
                                sizeInfo = undefined;
                                seederInfo = undefined;
                                leechInfo = undefined;
                                formattedText = undefined;
                            };

                            formattedText = $('<div class="sukebeiRegularLink"><a href="' + magnetLink + '"><span>' + sizeInfo + ' - ' + seederInfo + '|' + leechInfo +'</span></a></div>          ');
                            //formattedText.insertAfter(searchText)
                            downloadButtons.append(formattedText)
                            regularLinks.push(formattedText)
                            //console.log(typeof regularLinks);
                            //for(var x = 0; x < regularLinks.length; x+=3) {
                            //    downloadButtons.append(regularLinks.slice(x, x+4).wrapAll("<div class='sukebeiRegularLink'></div>"));
                            //}
                            $('div.sukebeiRegularLink').css({'background-color': '#e7e7e7', 'width': '23%', 'display': 'inline-block', 'margin-right': '2px', 'margin-bottom': '2px'});
                            infoSlots = undefined;
                        };


                        if (goodTorrentTable.length == 0 && regularTorrentTable.length == 0){
                            torrentGet.text("Found no results. Click search button above to make sure");
                        } else {
                            torrentGet.remove();
                        }
                        goodTorrentTable = [];
                        regularTorrentTable = [];
                        movieIdLeading = "";
                        rawMovieId = "";
                        properMovieIdNumbers = "";
                        // console.log(regularLinks);

                    }
                })
            });
        });
    })
};
