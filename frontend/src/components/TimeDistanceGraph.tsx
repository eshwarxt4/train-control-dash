import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Train, Conflict } from '@/types/rail';
import { stations } from '@/data/scenarios';
import { Badge } from '@/components/ui/badge';
import { Train as TrainIcon, Clock } from 'lucide-react';

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

  const parseTime = (timeStr: string | undefined): number => {
    if (!timeStr) return 0;
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
          .y(d => yScale(d[1]))
          .curve(d3.curveMonotoneX); // Smooth curve for more realistic train movement

        // Train path with gradient effect
        const gradient = g.append("defs")
          .append("linearGradient")
          .attr("id", `gradient-${train.id}`)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", xScale(trajectoryPoints[0][0]))
          .attr("x2", xScale(trajectoryPoints[trajectoryPoints.length - 1][0]));

        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", trainColor)
          .attr("stop-opacity", 0.3);

        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", trainColor)
          .attr("stop-opacity", 1);

        // Train path background (wider, lighter)
        g.append("path")
          .datum(trajectoryPoints)
          .attr("fill", "none")
          .attr("stroke", trainColor)
          .attr("stroke-width", 6)
          .attr("stroke-opacity", 0.2)
          .attr("d", line);

        // Train path main line
        g.append("path")
          .datum(trajectoryPoints)
          .attr("fill", "none")
          .attr("stroke", `url(#gradient-${train.id})`)
          .attr("stroke-width", 3)
          .attr("d", line)
          .attr("stroke-dasharray", (train.status === 'delayed') ? "5,5" : "none");

        // Current position marker with enhanced visual
        const currentPos = calculateTrainPosition(train, currentTime);
        const isRunning = parseTime(currentTime) >= parseTime(train.depart);
        if (currentPos > 0 && currentPos <= 75) {
          // Outer glow for running trains
          if (isRunning && train.status !== 'delayed' && train.status !== 'breakdown') {
            g.append("circle")
              .attr("cx", currentTimeLine)
              .attr("cy", yScale(currentPos))
              .attr("r", 12)
              .attr("fill", trainColor)
              .attr("opacity", 0.2)
              .attr("class", "train-glow");
          }

          // Main train marker
          const trainMarker = g.append("g")
            .attr("class", "train-marker")
            .attr("transform", `translate(${currentTimeLine}, ${yScale(currentPos)})`);

          // Train body (rectangle for more realistic look)
          trainMarker.append("rect")
            .attr("x", -8)
            .attr("y", -4)
            .attr("width", 16)
            .attr("height", 8)
            .attr("fill", trainColor)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("rx", 2);

          // Train status indicator
          if (train.status === 'breakdown') {
            trainMarker.append("circle")
              .attr("cx", 6)
              .attr("cy", -6)
              .attr("r", 3)
              .attr("fill", "#ef4444")
              .attr("stroke", "white")
              .attr("stroke-width", 1);
          } else if (train.delay > 0) {
            trainMarker.append("circle")
              .attr("cx", 6)
              .attr("cy", -6)
              .attr("r", 3)
              .attr("fill", "#f59e0b")
              .attr("stroke", "white")
              .attr("stroke-width", 1);
          }

          // Train ID label with background
          const labelGroup = g.append("g")
            .attr("class", "train-label")
            .attr("transform", `translate(${currentTimeLine + 12}, ${yScale(currentPos)})`);

          // Label background
          labelGroup.append("rect")
            .attr("x", -2)
            .attr("y", -8)
            .attr("width", train.id.length * 6 + 4)
            .attr("height", 16)
            .attr("fill", "hsl(var(--background))")
            .attr("stroke", trainColor)
            .attr("stroke-width", 1)
            .attr("rx", 2)
            .attr("opacity", 0.9);

          // Label text
          labelGroup.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .attr("fill", "hsl(var(--foreground))")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .text(train.id);

          // Speed indicator (small arrow for direction/movement)
          if (isRunning && train.status !== 'delayed' && train.status !== 'breakdown') {
            trainMarker.append("polygon")
              .attr("points", "8,0 12,2 12,-2")
              .attr("fill", "white")
              .attr("opacity", 0.8);
          }
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

      {/* Enhanced Train Status Display */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-foreground">Active Trains</h5>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span>Running</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              <span>Delayed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <span>Emergency</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {trains.map(train => {
            const departTime = train.depart || '00:00';
            const isActive = parseTime(currentTime) >= parseTime(departTime);
            const position = calculateTrainPosition(train, currentTime);
            
            return (
              <div
                key={train.id}
                className={`flex items-center space-x-3 p-3 bg-panel rounded-lg border transition-all ${
                  train.status === 'delayed' || train.status === 'breakdown' 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : isActive 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-panel-border'
                }`}
              >
                {/* Train Icon */}
                <div className={`w-10 h-6 rounded flex items-center justify-center relative`} 
                     style={{ backgroundColor: getTrainColor(train.type) }}>
                  <TrainIcon className="w-4 h-4 text-white" />
                  {(train.status === 'delayed' || train.status === 'breakdown') && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                
                {/* Train Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-sm font-bold text-foreground">{train.id}</span>
                    <Badge 
                      variant={train.type === 'Express' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {train.type}
                    </Badge>
                    {train.delay > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        +{train.delay}min
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{departTime}</span>
                      <span>•</span>
                      <span>{train.speed_kmph}km/h</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {train.status === 'delayed' || train.status === 'breakdown' ? (
                        <span className="text-destructive font-medium">BREAKDOWN</span>
                      ) : isActive ? (
                        <>
                          <span className="text-success">Running</span>
                          <span className="text-muted-foreground">@ {position.toFixed(1)}km</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Scheduled</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  {isActive && position > 0 && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((position / 75) * 100, 100)}%`,
                            backgroundColor: getTrainColor(train.type)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}