import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoogleCalendarWidget({ interviews = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const generateMonthGrid = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let grid = [];
    let week = Array(7).fill(null);

    let dayCounter = 1;
    for (let i = 0; i < 7; i++) {
      if (i >= firstDay) {
        let dot = null;
        if (dayCounter % 5 === 0) dot = 'blue';
        else if (dayCounter % 7 === 0) dot = 'pink';

        week[i] = {
          day: dayCounter,
          active: dayCounter === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
          dot
        };
        dayCounter++;
      }
    }
    grid.push(week);

    while (dayCounter <= daysInMonth) {
      let week = Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        let dot = null;
        if (dayCounter % 5 === 0) dot = 'blue';
        else if (dayCounter % 7 === 0) dot = 'pink';

        week[i] = {
          day: dayCounter,
          active: dayCounter === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
          dot
        };
        dayCounter++;
      }
      grid.push(week);
    }
    return grid;
  };

  const calendarGrid = useMemo(() => generateMonthGrid(currentDate), [currentDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="flex flex-col gap-6">
      {/* "Scheduled" Section */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Scheduled</h3>   

        <div className="bg-surface-900 rounded-3xl p-6 border border-black/5 dark:border-white/5">
          {/* Month & Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-base text-foreground">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="text-foreground-muted hover:text-foreground transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} className="text-foreground-muted hover:text-foreground transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {days.map(d => (
              <div key={d} className="text-[10px] font-bold text-foreground-muted text-center">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-3 mb-6">
            {calendarGrid.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7">
                {week.map((dateObj, dIdx) => {
                  if (!dateObj) return <div key={dIdx} className="text-center h-8" />;

                  const isObj = typeof dateObj === 'object';
                  const day = isObj ? dateObj.day : dateObj;
                  const isActive = isObj && dateObj.active;
                  const dotColor = isObj ? dateObj.dot : null;

                  return (
                    <div key={dIdx} className="relative flex flex-col items-center justify-center h-8">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-foreground text-surface-900'
                          : 'text-foreground hover:bg-surface-800'
                      }`}>
                        {day}
                      </div>
                      {dotColor && (
                        <span className={`absolute bottom-0 w-1 h-1 rounded-full ${
                          dotColor === 'blue' ? 'bg-blue-500' : 'bg-pink-500'   
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-foreground-muted pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Extracurricular
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span> Test
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Online lesson
            </div>
          </div>
        </div>
      </div>

      {/* "Upcoming" Section */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Upcoming</h3>       
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg font-bold animate-pulse">Sync Active</span>
        </div>

        <div className="relative pl-12 space-y-4">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[35px] top-4 bottom-4 w-px bg-surface-700 border-l border-dashed border-surface-600" />

          {interviews.length > 0 ? interviews.slice(0, 3).map((interview, i) => {
             const dateStr = interview.created_at || interview.started_at;
             const dateObj = dateStr ? new Date(dateStr) : null;
             const isValidDate = dateObj && !isNaN(dateObj.getTime());
             return (
             <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative">
               <span className="absolute -left-12 top-4 text-[10px] font-bold text-foreground-muted">
                 {isValidDate ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
               </span>
               <div className={`rounded-2xl p-4 flex gap-4 ml-2 ${i % 2 === 0 ? 'bg-emerald-500/10' : 'bg-pink-500/10'}`}>
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-pink-500'}`}>
                   {i % 2 === 0 ? <Video size={14} /> : <CalendarIcon size={14} />}
                 </div>
                 <div>
                   <h4 className={`font-bold text-sm ${i % 2 === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-pink-700 dark:text-pink-300'}`}>
                     {interview.job_title || interview.interview_type || 'Mock Interview'}
                   </h4>
                   <p className={`text-xs font-medium ${i % 2 === 0 ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-pink-600/70 dark:text-pink-400/70'}`}>
                     {interview.company || 'Practice Session'} {isValidDate ? `• ${dateObj.toLocaleDateString()}` : ''}
                   </p>
                 </div>
               </div>
             </motion.div>
          )}) : (
            <div className="text-sm text-foreground-muted italic mt-6">No scheduled meetings.</div>
          )}

        </div>
      </div>
    </div>
  );
}
