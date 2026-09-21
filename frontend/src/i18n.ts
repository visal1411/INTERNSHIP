import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: "Dashboard",
        herd: "Herd Management",
        devices: "Scale Devices",
        settings: "Settings",
      },
      dashboard: {
        overview: "Dashboard Overview",
        totalCows: "Total Active Cows",
        avgWeight: "Avg. Herd Weight",
        overweightAlerts: "Overweight Alerts",
        recentWeighIns: "Recent Weigh-ins",
        viewAll: "View All",
        trendUp: "up",
        trendDown: "down",
        trendStable: "stable"
      },
      search: {
        placeholder: "Search by tag ID..."
      },
      devices: {
        title: "Scale Devices",
        addDevice: "Add New Scale",
        statusOnline: "Online",
        statusOffline: "Offline",
        battery: "Battery",
        lastSync: "Last Sync",
        currentReading: "Current Reading",
        liveReading: "Live Reading",
        zeroScale: "Zero Scale",
        logsTitle: "Recent Activity",
        logTime: "Time",
        logType: "Event",
        logDetails: "Details"
      },
      status: {
        overweight: "Overweight",
        normal: "Normal",
        critical: "Critical",
        warning: "Warning"
      },
      timeFilter: {
        last7Days: "Last 7 days",
        last30Days: "Last 30 days",
        thisYear: "This Year"
      },
      herd: {
        title: "Herd Management",
        subtitle: "Manage your livestock, view records, and track health.",
        addCow: "Add Cow",
        searchPlaceholder: "Search by Tag ID or Status...",
        filterAllGenders: "All Genders",
        filterMale: "Male",
        filterFemale: "Female",
        filterAllBreeds: "All Breeds",
        filter: "Filter",
        export: "Export",
        table: {
          tagId: "Tag ID",
          weight: "Weight (kg)",
          status: "Status",
          lastSync: "Last Sync",
          actions: "Actions"
        },
        noResults: "No cows found matching your search.",
        detail: {
          currentWeight: "Current Weight",
          healthStatus: "Health Status",
          weightHistory: "Weight History (YTD)",
          editRecord: "Edit Record",
          addWeighIn: "Add Weigh-in"
        }
      },
      settings: {
        title: "Settings",
        subtitle: "Manage your account and configure your devices.",
        successMsg: "Settings saved successfully.",
        save: "Save Changes",
        profile: {
          tab: "Profile Information",
          title: "Profile Settings",
          fullName: "Full Name",
          email: "Email Address",
          farmName: "Farm Name",
          security: "Security",
          password: "New Password"
        },
        wifi: {
          tab: "WiFi Configuration",
          title: "Microcontroller WiFi Configuration",
          description: "Enter the WiFi credentials that your smart scales will use to connect to the network. Generate a config file to flash onto your devices.",
          ssid: "Network Name (SSID)",
          password: "WiFi Password",
          generateBtn: "Save Configuration"
        },
        notifications: {
          tab: "Notifications",
          title: "Notification Preferences",
          description: "Choose how you want to be notified about your herd.",
          email: "Email Alerts",
          emailDesc: "Receive daily summaries and critical alerts via email.",
          sms: "SMS Alerts",
          smsDesc: "Get text messages for critical herd health warnings.",
          rulesTitle: "Rules & Sound",
          beep: "Capture beep feedback sound",
          beepDesc: "Plays confirmation chime on client browser as soon as stable loads are locked.",
          warning: "Warning notifications trigger",
          warningDesc: "Push notification banner visual indicators immediately on drastic weight drops."
        }
      }
    }
  },
  km: {
    translation: {
      nav: {
        home: "ផ្ទាំងគ្រប់គ្រង",
        herd: "ការគ្រប់គ្រងហ្វូង",
        devices: "ឧបករណ៍ថ្លឹង",
        settings: "ការកំណត់",
      },
      dashboard: {
        overview: "ទិដ្ឋភាពទូទៅ",
        totalCows: "ចំនួនគោសរុប",
        avgWeight: "ទម្ងន់មធ្យម",
        overweightAlerts: "ការព្រមានលើសទម្ងន់",
        recentWeighIns: "ការថ្លឹងទម្ងន់ថ្មីៗ",
        viewAll: "មើលទាំងអស់",
        trendUp: "កើនឡើង",
        trendDown: "ថយចុះ",
        trendStable: "ថេរ"
      },
      search: {
        placeholder: "ស្វែងរកតាមលេខកូដ..."
      },
      devices: {
        title: "ឧបករណ៍ថ្លឹង",
        addDevice: "បន្ថែមឧបករណ៍ថ្មី",
        statusOnline: "អនឡាញ",
        statusOffline: "អូហ្វឡាញ",
        battery: "ថ្ម",
        lastSync: "សមកាលកម្មចុងក្រោយ",
        currentReading: "ទម្ងន់បច្ចុប្បន្ន",
        liveReading: "ទម្ងន់ផ្ទាល់",
        zeroScale: "កំណត់ជញ្ជីងទៅសូន្យ",
        logsTitle: "សកម្មភាពថ្មីៗ",
        logTime: "ពេលវេលា",
        logType: "ព្រឹត្តិការណ៍",
        logDetails: "ព័ត៌មានលម្អិត"
      },
      status: {
        overweight: "លើសទម្ងន់",
        normal: "ធម្មតា",
        critical: "ធ្ងន់ធ្ងរ",
        warning: "ព្រមាន"
      },
      timeFilter: {
        last7Days: "៧ថ្ងៃចុងក្រោយ",
        last30Days: "៣០ថ្ងៃចុងក្រោយ",
        thisYear: "ឆ្នាំនេះ"
      },
      herd: {
        title: "ការគ្រប់គ្រងហ្វូង",
        subtitle: "គ្រប់គ្រងសត្វពាហនៈរបស់អ្នក មើលកំណត់ត្រា និងតាមដានសុខភាព។",
        addCow: "បន្ថែមសត្វគោ",
        searchPlaceholder: "ស្វែងរកតាមលេខកូដ ឬស្ថានភាព...",
        filterAllGenders: "ភេទទាំងអស់",
        filterMale: "ឈ្មោល",
        filterFemale: "ញី",
        filterAllBreeds: "ពូជទាំងអស់",
        filter: "ចម្រោះ",
        export: "នាំចេញ",
        table: {
          tagId: "លេខកូដ",
          weight: "ទម្ងន់ (kg)",
          status: "ស្ថានភាព",
          lastSync: "សមកាលកម្មចុងក្រោយ",
          actions: "សកម្មភាព"
        },
        noResults: "រកមិនឃើញគោដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។",
        detail: {
          currentWeight: "ទម្ងន់បច្ចុប្បន្ន",
          healthStatus: "ស្ថានភាពសុខភាព",
          weightHistory: "ប្រវត្តិទម្ងន់ (ឆ្នាំនេះ)",
          editRecord: "កែសម្រួលកំណត់ត្រា",
          addWeighIn: "បន្ថែមការថ្លឹង"
        }
      },
      settings: {
        title: "ការកំណត់",
        subtitle: "គ្រប់គ្រងគណនីរបស់អ្នក និងកំណត់រចនាសម្ព័ន្ធឧបករណ៍របស់អ្នក។",
        successMsg: "ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ។",
        save: "រក្សាទុកការផ្លាស់ប្តូរ",
        profile: {
          tab: "ព័ត៌មានប្រវត្តិរូប",
          title: "ការកំណត់ប្រវត្តិរូប",
          fullName: "ឈ្មោះ​ពេញ",
          email: "អាសយដ្ឋានអ៊ីមែល",
          farmName: "ឈ្មោះកសិដ្ឋាន",
          security: "សុវត្ថិភាព",
          password: "ពាក្យសម្ងាត់ថ្មី"
        },
        wifi: {
          tab: "ការកំណត់វ៉ាយហ្វាយ (WiFi)",
          title: "ការកំណត់វ៉ាយហ្វាយម៉ៃក្រូកុងត្រូល័រ",
          description: "បញ្ចូលព័ត៌មានវ៉ាយហ្វាយដែលជញ្ជីងឆ្លាតវៃរបស់អ្នកនឹងប្រើដើម្បីភ្ជាប់ទៅបណ្តាញ។",
          ssid: "ឈ្មោះបណ្តាញ (SSID)",
          password: "ពាក្យសម្ងាត់វ៉ាយហ្វាយ",
          generateBtn: "រក្សាទុកការកំណត់"
        },
        notifications: {
          tab: "ការជូនដំណឹង",
          title: "ចំណូលចិត្តការជូនដំណឹង",
          description: "ជ្រើសរើសរបៀបដែលអ្នកចង់ទទួលបានការជូនដំណឹងអំពីហ្វូងសត្វរបស់អ្នក។",
          email: "ការជូនដំណឹងតាមអ៊ីមែល",
          emailDesc: "ទទួលបានសេចក្តីសង្ខេបប្រចាំថ្ងៃ និងការព្រមានសំខាន់ៗតាមរយៈអ៊ីមែល។",
          sms: "ការជូនដំណឹងតាមសារ SMS",
          smsDesc: "ទទួលបានសារអត្ថបទសម្រាប់ការព្រមានអំពីសុខភាពហ្វូងសត្វធ្ងន់ធ្ងរ។",
          rulesTitle: "ច្បាប់ និងសំឡេង",
          beep: "សំឡេងបញ្ជាក់ពេលថ្លឹង",
          beepDesc: "ចាក់សំឡេងបញ្ជាក់លើកម្មវិធីរុករកនៅពេលទម្ងន់មានស្ថេរភាព។",
          warning: "ការព្រមានការជូនដំណឹង",
          warningDesc: "បង្ហាញបដាជូនដំណឹងភ្លាមៗនៅពេលទម្ងន់ធ្លាក់ចុះខ្លាំង។"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
