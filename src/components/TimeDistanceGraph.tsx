import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Train, Conflict } from '@/types/rail';
import { stations } from '@/data/scenarios';
import { Badge } from '@/components/ui/badge';

interface TimeDistanceGraphProps {
  trains: Train[];
  currentTime: string;
  conflicts: Conflict[];
  calculateTrainPosition: (train: Train, time: string) => number;
  showSimulationOverlay: boolean;
}

export function TimeDistanceGraph({
  trains,
  currentTime,
  conflicts,
  calculateTrainPosition,
  showSimulationOverlay,
}: TimeDistanceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const getTrainColor = (type: Train['type']) => {
    switch (type) {
      case 'Express': return '#3b82f6'; // Blue
      case 'Local': return '#10b981'; // Green  
      case 'Freight': return '#f59e0b'; // Orange
      default: return '#6b7280';
    }
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes; // Convert to minutes since midnight
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 40, right: 60, bottom: 40, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.bottom - margin.top;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Time scale (X-axis) - showing 2-hour window
    const currentTimeMinutes = parseTime(currentTime);
    const timeExtent = [currentTimeMinutes - 60, currentTimeMinutes + 60]; // ±1 hour
    const xScale = d3.scaleLinear()
      .domain(timeExtent)
      .range([0, width]);

    // Distance scale (Y-axis) - stations A to D
    const yScale = d3.scaleLinear()
      .domain([0, 75]) // 0 to 75 km
      .range([height, 0]);

    // Draw grid lines
    g.selectAll(".grid-line-x")
      .data(xScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "grid-line-x")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "hsl(var(--grid-line))")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    g.selectAll(".grid-line-y")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "hsl(var(--grid-line))")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    // Draw station markers
    stations.forEach(station => {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(station.position))
        .attr("y2", yScale(station.position))
        .attr("stroke", "hsl(var(--primary))")
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", -10)
        .attr("y", yScale(station.position))
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "hsl(var(--foreground))")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(station.name);
    });

    // Draw current time line
    const currentTimeLine = xScale(currentTimeMinutes);
    g.append("line")
      .attr("x1", currentTimeLine)
      .attr("x2", currentTimeLine)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "hsl(var(--warning))")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Draw conflict zones
    conflicts.forEach(conflict => {
      const conflictTrains = trains.filter(t => conflict.trains.includes(t.id));
      if (conflictTrains.length >= 2) {
        const pos1 = calculateTrainPosition(conflictTrains[0], currentTime);
        const pos2 = calculateTrainPosition(conflictTrains[1], currentTime);
        const avgPos = (pos1 + pos2) / 2;
        
        g.append("rect")
          .attr("x", currentTimeLine - 30)
          .attr("y", yScale(avgPos + 5))
          .attr("width", 60)
          .attr("height", yScale(avgPos - 5) - yScale(avgPos + 5))
          .attr("fill", "hsl(var(--conflict-zone))")
          .attr("opacity", 0.3)
          .attr("rx", 4);
      }
    });

    // Draw train paths
    trains.forEach(train => {
      const departTimeMinutes = parseTime(train.depart);
      const trainColor = getTrainColor(train.type);
      
      // Calculate train trajectory
      const trajectoryPoints: [number, number][] = [];
      for (let t = departTimeMinutes; t <= timeExtent[1]; t += 5) {
        const timeStr = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
        const position = calculateTrainPosition(train, timeStr);
        if (position <= 75) { // Don't go beyond final station
          trajectoryPoints.push([t, position]);
        }
      }

      if (trajectoryPoints.length > 1) {
        const line = d3.line<[number, number]>()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]));

        // Train path
        g.append("path")
          .datum(trajectoryPoints)
          .attr("fill", "none")
          .attr("stroke", trainColor)
          .attr("stroke-width", 3)
          .attr("d", line);

        // Current position marker
        const currentPos = calculateTrainPosition(train, currentTime);
        if (currentPos > 0 && currentPos <= 75) {
          g.append("circle")
            .attr("cx", currentTimeLine)
            .attr("cy", yScale(currentPos))
            .attr("r", 6)
            .attr("fill", trainColor)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

          // Train label
          g.append("text")
            .attr("x", currentTimeLine + 10)
            .attr("y", yScale(currentPos))
            .attr("dy", "0.35em")
            .attr("fill", "hsl(var(--foreground))")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .text(train.id);
        }
      }
    });

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        const hours = Math.floor(d as number / 60);
        const mins = (d as number) % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
      });

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "hsl(var(--muted-foreground))");

    // Y-axis  
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}km`);

    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "hsl(var(--muted-foreground))");

  }, [trains, currentTime, conflicts, calculateTrainPosition]);

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h4 className="font-medium text-foreground">Live Traffic View</h4>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-express"></div>
              <span className="text-xs text-muted-foreground">Express</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-local"></div>
              <span className="text-xs text-muted-foreground">Local</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-freight"></div>
              <span className="text-xs text-muted-foreground">Freight</span>
            </div>
          </div>
        </div>
        {showSimulationOverlay && (
          <Badge variant="secondary" className="animate-pulse">
            Simulation Preview
          </Badge>
        )}
      </div>
      
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox="0 0 600 400"
          className="border border-panel-border rounded-lg"
        />
        
        {showSimulationOverlay && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-primary/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-primary text-sm font-medium">Preview Mode</div>
              <div className="text-xs text-muted-foreground">Showing predicted outcomes</div>
            </div>
          </div>
        )}
      </div>

      {/* Train Status Cards */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {trains.slice(0, 4).map(train => (
          <div
            key={train.id}
            className="flex items-center space-x-2 p-2 bg-panel rounded border border-panel-border"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getTrainColor(train.type) }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-mono text-sm font-medium text-foreground">{train.id}</span>
                <Badge variant="outline" className="text-xs">
                  {train.type}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {train.status === 'breakdown' ? 'BREAKDOWN' : 
                 parseTime(currentTime) < parseTime(train.depart) ? 'Scheduled' : 'Running'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}