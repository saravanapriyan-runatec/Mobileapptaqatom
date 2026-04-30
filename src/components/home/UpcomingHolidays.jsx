import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import ProfileServices from '../../../Services/API/ProfileServices';
import AuthService from '../../../Services/AuthService';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import SkeletonLoader from './SkeletonLoader';

export default React.memo(function UpcomingHolidays({ onNavigate }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchHolidays();
  }, [i18n.language]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const authUserId = await AuthService.getUserId();
      const userDetails = await ProfileServices.getUserDetailsData(authUserId);
      const employee = await ProfileServices.getEmployeeDetailsData(userDetails?.username);
      const empId = employee?.id;

      if (!empId) {
          console.warn("UpcomingHolidays: Could not resolve employee ID");
          setLoading(false);
          return;
      }

      const currentYear = new Date().getFullYear();
      const response = await ProfileServices.getHolidayDetails(empId, currentYear);
      // console.log('DEBUG: UpcomingHolidays Response:', JSON.stringify(response, null, 2));

      const data = get(response, 'results') || (Array.isArray(response) ? response : []);
      const mappedHolidays = data.map((item, index) => {
        const dateParts = (item.start_date || '').split('-');
        let dateObj;
        if (dateParts.length === 3) {
          dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else {
          dateObj = new Date();
        }

        const monthTokens = [
          tokens.months.january, tokens.months.february, tokens.months.march, tokens.months.april,
          tokens.months.mayFull, tokens.months.june, tokens.months.july, tokens.months.august,
          tokens.months.september, tokens.months.october, tokens.months.november, tokens.months.december
        ];
        
        const dayTokens = [
          tokens.days.sunday, tokens.days.monday, tokens.days.tuesday, tokens.days.wednesday,
          tokens.days.thursday, tokens.days.friday, tokens.days.saturday
        ];

        return {
          id: `holiday-${item.id || index}-${index}`,
          date: `${t(monthTokens[dateObj.getMonth()])} ${dateObj.getDate()}`,
          day: t(dayTokens[dateObj.getDay()]),
          name: item.alias || item.name || t(tokens.holidays.publicHoliday),
          rawDate: item.start_date
        };
      });

      const today = new Date().toISOString().split('T')[0];
      const upcomingHolidays = mappedHolidays
        .filter(h => h.rawDate >= today)
        .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
        .slice(0, 3);

      setHolidays(upcomingHolidays); 
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t(tokens.dashboard.upcomingHolidays)}</Text>
        </View>
        <View style={styles.listContainer}>
          {[1, 2].map(i => (
            <View key={i} style={styles.holidayRow}>
              <SkeletonLoader width={80} height={30} borderRadius={4} />
              <View style={styles.verticalLine} />
              <SkeletonLoader width={150} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(tokens.dashboard.upcomingHolidays)}</Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('holiday')}>
          <Text style={styles.viewAll}>{t(tokens.dashboard.viewAll)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {holidays.length === 0 ? (
          <Text style={styles.emptyText}>{t(tokens.dashboard.noHolidays)}</Text>
        ) : (
          holidays.map((holiday) => (
            <View key={holiday.id} style={styles.holidayRow}>
              {/* Left side: Date */}
              <View style={styles.dateColumn}>
                <Text style={styles.dateText}>{holiday.date}</Text>
                <Text style={styles.dayText}>{holiday.day}</Text>
              </View>

              {/* Vertical Line */}
              <View style={styles.verticalLine} />

              {/* Right side: Holiday Name */}
              <View style={styles.nameColumn}>
                <Text style={styles.holidayName}>{holiday.name}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingRight: 0,
  },
  centerContent: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  viewAll: {
    fontSize: 12,
    color: '#395CC6',
    fontWeight: '500',
  },
  listContainer: {
    gap: 12,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  dateColumn: {
    width: 90,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 12,
    color: '#80828D',
    opacity: 0.8,
  },
  verticalLine: {
    width: 2,
    height: 32,
    backgroundColor: '#4169E1',
    marginHorizontal: 16,
    borderRadius: 1,
  },
  nameColumn: {
    flex: 1,
  },
  holidayName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
  },
  emptyText: {
    textAlign: 'center',
    color: '#80828D',
    marginTop: 20,
  },
});
