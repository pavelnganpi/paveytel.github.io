function httpGet(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(JSON.parse(xmlHttp.responseText));
    };
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

function isLetter(character) {
    var asciiValue = character.charCodeAt(0);
    if ((asciiValue >= 65 && asciiValue <= 90) || (asciiValue >= 97 && asciiValue <= 122)) {
        return true;
    }
    return false;
}

//function to customize arrays.sorts to sort alphabetically
function compare(a, b) {
    if (a.x < b.x)
        return -1;
    if (a.x > b.x)
        return 1;
    return 0;
}

//sets up data to be drawn by d3
var setupBarChartData = function (data) {

    var frequencies = {},
        character, i, j;

    for (j = 0; j < data.length; j++) {
        var login = data[j].toUpperCase();
        for (i = 0; i < login.length; i++) {
            character = login.charAt(i);
            if (character !== ' ' && isLetter(character)) {
                frequencies[character] = frequencies[character] || 0;
                frequencies[character]++;
            }

        }
    }

    var chartData = [];

    for (var key in frequencies) {
        var data = {
            'x': key,
            'y': frequencies[key]
        };
        chartData.sort(compare);
        chartData.push(data);
    }
    return chartData
};

var searchQuery = '';
document.getElementById("searchButton").addEventListener("click", function () {
    searchQuery = document.getElementById('searchBox').value;
    var url = 'https://api.github.com/search/users?q=' + searchQuery;
    httpGet(url, callback);

});

document.getElementById("searchBox").addEventListener("keypress", function (e) {
    var code = e.keyCode || e.which;
    if (code === 13) {
        e.preventDefault();
        searchQuery = document.getElementById('searchBox').value;
        var url = 'https://api.github.com/search/users?q=' + searchQuery;
        httpGet(url, callback);
    }
});

var callback = function (res) {
    var resultSize = res.items.length;
    var loginArray = [];

    //if there is no user for associated with searchQuery, reload the page
    if (resultSize === 0) {
        alert("opps no result for such query, please type another search");
        location.reload();// refreshes the pages
    }
    else if (resultSize >= 5) {
        for (var i = 0; i < resultSize; i++) {
            loginArray.push(res.items[i].login);
        }
    }
    else {
        for (var j = 0; j < resultSize; j++) {
            loginArray.push(res.items[j].login);
        }
    }

    loginArray.sort(); //sorts by login
    var barChartData = setupBarChartData(loginArray);
    drawBarChart(barChartData);

};

function drawBarChart(barChartData) {

    //clears previous bar chat
    var svg = d3.select("svg");
    svg.selectAll("*").remove();

    var vis = d3.select('#visualisation'),
        WIDTH = 1000,
        HEIGHT = 500,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
        },
        xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(barChartData.map(function (d) {
            return d.x;
        })),


        yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
            d3.max(barChartData, function (d) {
                return d.y;
            })
        ]),

        xAxis = d3.svg.axis()
            .scale(xRange)
            .tickSize(5)
            .tickSubdivide(true),

        yAxis = d3.svg.axis()
            .scale(yRange)
            .tickSize(5)
            .orient("left")
            .tickSubdivide(true);



    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
        .call(xAxis);

    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
        .call(yAxis);

    //tooltip for showing count value
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Value:</strong> <span style='color:red'>" + d.y + "</span>";
        });

    svg.call(tip);


    vis.selectAll('rect')
        .data(barChartData)
        .enter()
        .append('rect')
        .attr('x', function (d) {
            return xRange(d.x);
        })
        .attr('y', function (d) {
            return yRange(d.y);
        })
        .attr('width', xRange.rangeBand())
        .attr('height', function (d) {
            return ((HEIGHT - MARGINS.bottom) - yRange(d.y));
        })
        .attr('fill', 'grey')
        .on('mouseover', tip.show,function (d) {
            d3.select(this)
                .attr('fill', 'blue');
        })
        .on('mouseout', tip.hide,function (d) {
            d3.select(this)
                .attr('fill', 'grey');
        });

}