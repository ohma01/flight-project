function loadLiquidFillGauge(elementId, value) {
    let config = {
        minValue: 0, // The gauge minimum value.
        maxValue: 100, // The gauge maximum value.
        circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
        circleFillGap: 0.02, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor: "#178BCA", // The color of the outer circle.
        waveHeight: 0.03, // The wave height as a percentage of the radius of the wave circle.
        waveCount: 2, // The number of full waves per width of the wave circle.
        waveRiseTime: 4000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        // waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
        waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
        waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveAnimate: true, // Controls if the wave scrolls or is static.
        waveColor: "#178BCA", // The color of the fill wave.
        waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent: true, // If true, a % symbol is displayed after the value.
        textColor: "black", // The color of the value text when the wave does not overlap it.
        waveTextColor: "black" // The color of the value text when the wave overlaps it.
    };

    //configuring liquid guage
    var gauge = d3.select("#" + elementId);
    var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height"))) / 2;
    var locationX = parseInt(gauge.style("width")) / 2 - radius;
    var locationY = parseInt(gauge.style("height")) / 2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;

    var waveHeightScale;

    var waveHeightScale = d3.scale.linear()
        .range([0, config.waveHeight, 0])
        .domain([0, 50, 100]);


    var textPixels = (config.textSize * radius / 2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
    var percentText = config.displayPercent ? "%" : "";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    var waveLength = fillCircleRadius * 2 / config.waveCount;
    var waveClipCount = 1 + config.waveCount;
    var waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    var textRounder = function (value) { return Math.round(value); };
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(1); };
    }
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(2); };
    }

    // Data for building the clip wave area.
    var data = [];
    for (var i = 0; i <= 40 * waveClipCount; i++) {
        data.push({ x: i / (40 * waveClipCount), y: (i / (40)) });
       
        
    }

    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1]);
    var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius]);

    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
    var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
        // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
        // circle at 100%.
        .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
        .domain([0, 1]);

    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
        .domain([0, 1]);

    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform', 'translate(' + locationX + ',' + locationY + ')');

    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius - circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform', 'translate(' + radius + ',' + radius + ')');

    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function (d) { return waveScaleX(d.x); })
        .y0(function (d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI)); })
        .y1(function (d) { return (fillCircleRadius * 2 + waveHeight); });
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    // The inner circle with the clipping wave attached.
    if (value <= 50) {
        config.waveColor = "red"
    } else if (value <= 75) {
        config.waveColor = "yellow"
    } else {
        config.waveColor = "lightgreen"
    }

    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);

    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // Make the value count up.
    if (config.valueCountUp) {
        var textTween = function () {
            var i = d3.interpolate(this.textContent, textFinalValue);
            return function (t) { this.textContent = textRounder(i(t)) + percentText; }
        };
        text1.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
        text2.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (config.waveRise) {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .each("start", function () { wave.attr('transform', 'translate(1,0)'); }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
    } else {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }

    function GaugeUpdater() {

        this.update = function (value) {
            var newFinalValue = parseFloat(value).toFixed(2);
            var textRounderUpdater = function (value) { return Math.round(value); };
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(1); };
            }
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(2); };
            }
        }
    }

    return new GaugeUpdater();
}



function invoke() {
    sessionStorage.setItem("display", true)
    port = document.getElementById("port").value
    try {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", `http://localhost:${port}/test`)
        xhr.onreadystatechange = () => {
            if (xhr.status == 0 && xhr.readyState == 4 && xhr.response == "") {
                document.getElementById("message").className = "d-block text-danger text-bold"
            }
        }
        xhr.send()
        document.getElementById("out").className = "d-none"
    } finally {
        sessionStorage.setItem("load", true)

        return false
    }
}

function check() {
    let port = document.getElementById("port").value
    document.getElementById("verify").disabled = port.length == 4 ? false : true
}

function closeReport() {
    sessionStorage.clear()
    document.getElementById("in").className = "d-block"
    document.getElementById("out").className = "d-none"
    document.getElementById("port").value = null
}

function fetchFile() {
    document.getElementById("load").className = "d-none"
    document.getElementById("out").className = "d-none"
    document.getElementById("message").className = "d-none"
    if (sessionStorage.getItem("load"))
        document.getElementById("load").className = "d-block"
    try {
        let readFile = new XMLHttpRequest()
        readFile.onreadystatechange = () => {
            if (readFile.response && readFile.status == 200 && readFile.readyState == 4) {
                if (sessionStorage.getItem("display")) {
                    document.getElementById("load").className = "d-none"
                    document.getElementById("out").className = "d-block"
                    document.getElementById("in").className = "d-none"
                    dataObj = JSON.parse(readFile.response)
                    if (dataObj.length > 0) {
                        if (dataObj.length > 0) {
                            dataObj.forEach((value) => {
                                rows = ""
                                // rowSpan = value.errorList.length
                                for (td in value.errorList) {
                                    rows += Number(td) + 1 + " - " + value.errorList[td] + "<br/>"
                                }
                                table = `<tr>
                                <td class="pos text-center font-weight-bold">${value.moduleName}</td>`
                                if (rows) {
                                    table += `<td class="pos" style="color:red"><b>${rows}</b></td>`
                                }
                                else {
                                    table += `<td class="pos text-center text-success font-weight-bold"><h4 >Passed</h4></td>`
                                }
                                table += `<td class="pos text-center"><svg class="pos text-center" id='${value.moduleName}' width='60%' height='60%'></svg></td>
            </tr>`

                                document.getElementById('result').innerHTML += table
                            })
                            dataObj.forEach(async (i) => {
                                let percent = Math.round((i.noOfTestCasesPassed / i.totalNoOfTestCases) * 100);
                                await loadLiquidFillGauge(i.moduleName, percent);
                            })
                        }
                    }
                }
            }
        }
        readFile.open("GET", "http://localhost:5500/result.json")
        readFile.send()
    } finally { return false }
}



