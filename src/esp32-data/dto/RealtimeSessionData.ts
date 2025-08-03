interface RealtimeSessionData {
  sessionId: number;
  speakerId: number;
  speakerName: string;
  userId: number;
  status: string;
  startTime: string;
  durationMinutes: number;
  initialBatteryPercentage: number;
  
  // Datos más recientes del ESP32
  latestData: {
    timestamp: number;
    current_mA: number;
    voltage_V: number;
    power_mW: number;
    battery_remaining_percent: number;
    total_consumed_mAh: number;
    sample_index: number;
  };
  
  // Estadísticas acumuladas
  statistics: {
    avgCurrent_mA: number;
    avgVoltage_V: number;
    avgPower_mW: number;
    peakPower_mW: number;
    measurementCount: number;
    totalConsumed_mAh: number;
    durationSeconds: number;
  };
  
  lastUpdated: Date;
  created: Date;
}