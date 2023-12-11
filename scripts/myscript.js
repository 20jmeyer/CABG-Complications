Promise.all([
    d3.csv("https://raw.githubusercontent.com/20jmeyer/CABG-Complications/main/d3data/contingency_table_age.csv"),
    d3.csv("https://raw.githubusercontent.com/20jmeyer/CABG-Complications/main/d3data/contingency_table_gender.csv"),
    d3.csv("https://raw.githubusercontent.com/20jmeyer/CABG-Complications/main/d3data/contingency_table_payor.csv"),
    d3.csv("https://raw.githubusercontent.com/20jmeyer/CABG-Complications/main/d3data/contingency_table_race.csv"),
    d3.csv("https://raw.githubusercontent.com/20jmeyer/CABG-Complications/main/d3data/contingency_table_type.csv")
]).then(function(files) {

  function parseCSV(data) {
  // Extract column names (excluding the empty string key)
  const columnNames = Object.keys(data[0]).filter(key => key !== '');

  // Extract row names and data
  const rowNames = data.map(d => d['']);
  const dataArray = data.map(d => columnNames.map(column => +d[column]));

  return { data: dataArray, columnNames, rowNames };
  }

  const contingencyTables = [];
  const rowLabels = [];
  const columnLabels = [];

  d3.selectAll("button").on("click", function() {
switchTable(d3.select(this).node().value);
})

   const results = files.map(file => {
    const { data: dataArray, columnNames, rowNames } = parseCSV(file);
    contingencyTables.push(dataArray);
    rowLabels.push(rowNames);
    columnLabels.push(columnNames);
   });

      let currentTableIndex = 0;
      // Calculate row and column sums
      function calculateSums(table) {
        const rowSums = table.map((row) => d3.sum(row));
        const colSums = table.reduce(
          (acc, row) => row.map((cell, j) => (acc[j] || 0) + cell),
          []
        );
        return { rowSums, colSums };
      }

      let { rowSums, colSums } = calculateSums(
        contingencyTables[currentTableIndex]
      );

      // Set up the SVG container
      const svgWidth = 800;
      const svgHeight = 500;
      const margin = { top: 40, right: 20, bottom: 40, left: 300 }; // Adjusted for axis labels
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;

      // Create x scale
      let xScale = d3
        .scaleLinear()
        .domain([0, d3.sum(colSums)])
        .range([0, width]);

      // Use the provided color set
      const colorBrewerSet3 = [
        "#8dd3c7",
        "#ffffb3",
        "#bebada",
        "#fb8072",
        "#80b1d3",
        "#fdb462",
        "#b3de69",
        "#fccde5",
        "#d9d9d9",
        "#bc80bd",
        "#ccebc5",
        "#ffed6f",
      ];

      // Set up the SVG container
      const svg = d3
        .select("div#plot")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("text")
      .attr("x", width / 2)
      .attr("id","title")
      .attr("y", -margin.top/2)
      .attr("text-anchor", "middle") // Center the text
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("CABG Complications by Age");

      // Create group for each column
   const columnGroups = svg
        .selectAll(".column-group")
        .data(contingencyTables[currentTableIndex][0]) // Assuming each row has the same number of columns
        .enter()
        .append("g")
        .attr("id", (_, i) => "key" + i)
        .attr("class", "column-group")
        .attr(
          "transform",
          (d, i) => "translate(" + xScale(d3.sum(colSums.slice(0, i))) + ",0)"
        );

        // Create y scale for each column
      let yScales = contingencyTables[currentTableIndex][0].map((col, i) =>
        d3.scaleLinear().domain([0, colSums[i]]).range([0, height]).clamp(true)
      );

function extractColumnInRange(array, columnIndex, startRow, endRow) {
        return array
          .slice(startRow, endRow + 1)
          .reduce((sum, row) => sum + row[columnIndex], 0);
      }
      function extractColumnCumulativeSums(array) {
        return array.map((col, columnIndex) => {
          let runningSum = 0;
          return col.map((_, rowIndex) => {
            runningSum += array[rowIndex][columnIndex];
            return runningSum;
          });
        });
      }

       let sums = extractColumnCumulativeSums(
        contingencyTables[currentTableIndex]
      );
      // Add a column of zeros to the beginning of the array
      sums.forEach((col, i) => {
        col.unshift(0);
      });

      // Create rectangles for each cell in the mosaic plot
      const cells = columnGroups
        .selectAll(".cell")
        .data((d, i) => {
          return contingencyTables[currentTableIndex].map((row) => {
            const colData = row[i];
            return colData !== null ? { index: i, colData } : null;
          });
        })
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => {
          //d = col index, i = row index
          return yScales[d.index](
            extractColumnInRange(
              contingencyTables[currentTableIndex],
              d.index,
              0,
              i - 1
            )
          );
        })
        .attr("width", (d, i) => xScale(colSums[d.index]))
        .attr("height", (d, i) => yScales[d.index](d.colData))
        .style("fill", (d, i) => colorBrewerSet3[i % colorBrewerSet3.length]) // Repeating colors if needed
        .style("stroke", "white")
        .attr("desc", (d) => d.colData);

      // Add row labels in the middle of each row
      const rowLabelSelect = svg
        .selectAll(".row-label")
        .data(rowLabels[currentTableIndex])
        .enter()
        .append("text")
        .attr("class", "row-label")
        .attr("x", -margin.left / 5)
        .style("font-size", "small")
        .attr("y", (d, i) => {
          calcHeight = 0;
          if (i == 0) {
            calcHeight = yScales[0](
              extractColumnInRange(
                contingencyTables[currentTableIndex],
                0,
                0,
                0
              )
            )/2;
          } else {
            height1 = yScales[0](
              extractColumnInRange(
                contingencyTables[currentTableIndex],
                0,
                0,
                i - 1
              )
            );
            height2 = yScales[0](
              extractColumnInRange(
                contingencyTables[currentTableIndex],
                0,
                0,
                i
              )
            );
            calcHeight = (height1 + height2) / 2;
          }
          return calcHeight;
        })
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .text((d) => d);

      // Add column labels in the middle of each column
      const colLabelSelect = svg
        .selectAll(".column-label")
        .data(columnLabels[currentTableIndex])
        .enter()
        .append("text")
        .attr("class", "column-label")
        .attr(
          "x",
          (d, i) =>
            xScale(d3.sum(colSums.slice(0, i + 1))) - xScale(colSums[i]) / 2
        )
        .attr("y", (d, i) => height + margin.bottom / 2)
        .attr("font-size","small")
        .style("text-anchor", "middle")
        .text((d) => d);

      function switchTable(index) {
        currentTableIndex = +index;

        // Disable the current button
        d3.selectAll("button")
          .filter((d, i) => i !== currentTableIndex)
          .attr("disabled", null);
        // Enable the new button
        let disabledButton = `button#buttonTable${currentTableIndex + 1}`
        d3.select(disabledButton).attr("disabled", true);
        // Recalculate sums

        //Update column sizes
        UpdateColumnGroups(currentTableIndex);
        UpdateAxes(currentTableIndex);
        UpdateTitle(currentTableIndex)
      }
function UpdateColumnGroups(newIndex) {
        let { rowSums, colSums } = calculateSums(contingencyTables[newIndex]);
        xScale = d3
          .scaleLinear()
          .domain([0, d3.sum(colSums)])
          .range([0, width]);

        const transposedArray = contingencyTables[newIndex].map((col, i) =>
          contingencyTables[newIndex].map((row) => row[i])
        );

        let columnGroups = svg
          .selectAll(".column-group")
          .data(contingencyTables[newIndex][0]);

        columnGroups
          .enter()
          .append("g")
          .attr("class", "column-group")
          .attr("opacity", 0);

        columnGroups = svg.selectAll(".column-group").data(contingencyTables[newIndex][0]);
        columnGroups
          .attr(
            "transform",
            (d, i) => "translate(" + xScale(d3.sum(colSums.slice(0, i))) + ",0)"
          )
          .attr("opacity", 1);

        //Change scales and relevant sums

        yScales = contingencyTables[newIndex][0].map((col, i) =>
          d3.scaleLinear().domain([0, colSums[i]]).range([0, height])
        );
        console.log(contingencyTables[newIndex][0])
        sums = extractColumnCumulativeSums(
          contingencyTables[currentTableIndex]
        );
        sums.forEach((col, i) => {
          col.unshift(0);
        });
        //need to renew column group selection
        columnGroups = svg.selectAll(".column-group").data(contingencyTables[newIndex][0]);

        columnGroups.each(function (d, i) {
          let currentColumnGroup = d3.select(this);
          console.log(columnGroups.exit())
          if (currentColumnGroup in columnGroups.exit()){
            console.log("in exit");
          }
          let cells = currentColumnGroup
            .selectAll("rect")
            .data(transposedArray[i]);
          cells
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, rowI) => {
              //d = data, i = col index
              const slicedArray = transposedArray[i].slice(0, rowI);
              const sumOfSlice = slicedArray.reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
              );
              if (i < yScales.length){
                console.log(i, yScales.length)
              return yScales[i](sumOfSlice);
              }
              else{
                return 0
              }
            })
            .attr("opacity", 0);
          cells = currentColumnGroup.selectAll("rect").data(transposedArray[i]);
          cells
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .attr("x", 0)
            .attr("y", (d, rowI) => {
              //d = data, i = col index
              const slicedArray = transposedArray[i].slice(0, rowI);
              const sumOfSlice = slicedArray.reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
              );
              if (i < yScales.length){
              return yScales[i](sumOfSlice);
              }
              else{
                return 0
              }
            })
            .attr("opacity", 1)
            .attr("width", (d) => xScale(colSums[i]))
            .attr("height", (d, rowIndex) => yScales[i](d))
            .style(
              "fill",
              (d, rowIndex) =>
                colorBrewerSet3[rowIndex % colorBrewerSet3.length]
            ) // Repeating colors if needed
            .style("stroke", "white")
            .attr("desc", (d) => d);
          cells.exit().remove();
        });

        columnGroups
          .exit()
          .transition()
          .duration(100)
          .attr("opacity", 0)
          .remove();
      }

      function UpdateAxes(newIndex) {
          let { rowSums, colSums } = calculateSums(contingencyTables[newIndex]);
        const rowLabelSelect = svg
          .selectAll(".row-label")
          .data(rowLabels[newIndex]);

        rowLabelSelect
          .enter()
          .append("text")
          .attr("class", "row-label")
          .attr("x", -margin.left / 5)
          .merge(rowLabelSelect)
          .transition()
          .duration(200)
          .style("opacity", 0)
          .transition()
          .duration(200)
          .delay(200)
          .attr("dy", "0.35em")
          .style("text-anchor", "end")
          .attr("y", (d, i) => {
                    calcHeight = 0;
                    if (i == 0) {
                      calcHeight = yScales[0](
                        extractColumnInRange(
                          contingencyTables[currentTableIndex],
                          0,
                          0,
                          0
                        )
                      )/2;
                    } else {
                      height1 = yScales[0](
                        extractColumnInRange(
                          contingencyTables[currentTableIndex],
                          0,
                          0,
                          i - 1
                        )
                      );
                      height2 = yScales[0](
                        extractColumnInRange(
                          contingencyTables[currentTableIndex],
                          0,
                          0,
                          i
                        )
                      );
                      calcHeight = (height1 + height2) / 2;
                    }
                    return calcHeight;
                  })
          .text((d) => d)
          .transition()
          .duration(300)
          .delay(200)
          .style("opacity", 1);

        rowLabelSelect.exit().remove();
        const colLabelSelect = svg
          .selectAll(".column-label")
          .data(columnLabels[newIndex]);


        xScale = d3
          .scaleLinear()
          .domain([0, d3.sum(colSums)])
          .range([0, width]);
        colLabelSelect.exit().remove();
        colLabelSelect
          .data(columnLabels[newIndex])
          .enter()
          .append("text")
          .attr("class", "column-label")
          .merge(colLabelSelect)
          .transition()
          .duration(200)
          .style("opacity", 0)
          .attr(
            "x",
            (d, i) =>
              xScale(d3.sum(colSums.slice(0, i + 1))) - xScale(colSums[i]) / 2
          )
          .attr("y", (d, i) => height + margin.bottom / 2)
          .attr("font-size", "small")
          .style("text-anchor", "middle")

          .transition()
          .duration(200)
          .delay(200)
          .attr(
            "x",
            (d, i) =>
              xScale(d3.sum(colSums.slice(0, i + 1))) - xScale(colSums[i]) / 2
          )
          .transition()
          .duration(300)
          .delay(200)
          .style("opacity", 1)
          .text((d) => d);
      }

    function UpdateTitle(newIndex){
      let titleList = ["CABG Complications by Age","CABG Complications by Gender","CABG Complications by Insurance Type","CABG Complications by Race","CABG Complications by Surgical Procedure"]
      let title = d3.select("text#title");
      title.text(titleList[newIndex])
      }
      }).catch(function(err) {
    console.log(err)
})
