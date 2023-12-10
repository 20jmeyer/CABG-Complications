// add your JavaScript/D3 to this file
const contingencyTables = [
        [
          [10, 20, 30],
          [15, 25, 35],
          [5, 10, 15],
        ],
        [
          [5, 10, 15],
          [20, 15, 100],
          [30, 35, 45],
        ],
      ];

      rowLabels = [
        ["asdf", "asdf", "sadf"],
        ["table2!", "asdf", "8iujnd"],
      ];
      columnLabels = [
        ["asdfasd", "asd", "asda"],
        ["iekd", "table2!", "ikmd"],
      ];

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
      const svgWidth = 600;
      const svgHeight = 300;
      const margin = { top: 40, right: 20, bottom: 40, left: 70 }; // Adjusted for axis labels
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;

      // Create x scale
      let xScale = d3
        .scaleLinear()
        .domain([0, d3.sum(colSums)])
        .range([0, width]);

      // Use the provided color set
      const colorBrewerSet3 = [
        "#80b1d3",
        "#fdb462",
        "#b3de69",
        "#fccde5",
        "#d9d9d9",
        "#bc80bd",
      ];

      // Set up the SVG container
      const svg = d3
        .select("div#plot")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Create group for each column
      const columnGroups = svg
        .selectAll(".column-group")
        .data(contingencyTables[currentTableIndex][0]) // Assuming each row has the same number of columns
        .enter()
        .append("g")
        .attr("class", "column-group")
        .attr(
          "transform",
          (d, i) => "translate(" + xScale(d3.sum(colSums.slice(0, i))) + ",0)"
        );

      // Create y scale for each column
      let yScales = contingencyTables[currentTableIndex][0].map((col, i) =>
        d3.scaleLinear().domain([0, colSums[i]]).range([0, height])
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
            return { index: i, colData: row[i] };
          });
        })
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => {
          console.log(d, i);
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
        .attr("x", -margin.left / 2)
        .attr("y", (d, i) => {
          console.log(d, i);
          return (yScales[0](sums[0][i + 1]) + yScales[0](sums[0][i])) / 2;
        })
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
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
        .style("text-anchor", "middle")
        .text((d) => d);

      function switchTable(index) {
        currentTableIndex = index;

        // Disable the current button
        d3.selectAll("button")
          .filter((d, i) => i !== currentTableIndex)
          .attr("disabled", null);
        // Enable the new button
        d3.select(`#buttonTable${index + 1}`).attr("disabled", true);
        // Recalculate sums
        ({ rowSums, colSums } = calculateSums(
          contingencyTables[currentTableIndex]
        ));

        //Change scales and relevant sums
        xScale = d3
          .scaleLinear()
          .domain([0, d3.sum(colSums)])
          .range([0, width]);
        yScales = contingencyTables[currentTableIndex][0].map((col, i) =>
          d3.scaleLinear().domain([0, colSums[i]]).range([0, height])
        );

        sums = extractColumnCumulativeSums(
          contingencyTables[currentTableIndex]
        );
        sums.forEach((col, i) => {
          col.unshift(0);
        });
        //Update column sizes
        columnGroups
          .data(contingencyTables[currentTableIndex][0]) // Assuming each row has the same number of columns
          .transition()
          .duration(1000)
          .attr(
            "transform",
            (d, i) => "translate(" + xScale(d3.sum(colSums.slice(0, i))) + ",0)"
          );

        //Update cells
        cells
          .data((d, i) => {
            return contingencyTables[currentTableIndex].map((row) => {
              return { index: i, colData: row[i] };
            });
          })
          .transition()
          .duration(1000)
          .attr("y", (d, i) => {
            console.log(d, i);
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

        //Update labels

        rowLabelSelect
          .data(rowLabels[currentTableIndex])
          .transition()
          .duration(200)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .attr("y", (d, i) => {
            console.log(d, i);
            return (yScales[0](sums[0][i + 1]) + yScales[0](sums[0][i])) / 2;
          })
          .transition()
          .duration(500)
          .style("opacity", 1)
          .text((d) => d);

        colLabelSelect
          .data(columnLabels[currentTableIndex])
          .transition()
          .duration(200)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .attr(
            "x",
            (d, i) =>
              xScale(d3.sum(colSums.slice(0, i + 1))) - xScale(colSums[i]) / 2
          )
          .transition()
          .duration(500)
          .style("opacity", 1)
          .text((d) => d);
      }
