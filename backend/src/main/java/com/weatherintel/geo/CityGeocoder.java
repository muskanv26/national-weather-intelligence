package com.weatherintel.geo;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class CityGeocoder {

    public record Coordinates(double latitude, double longitude) {
    }

    private static final Coordinates INDIA_CENTROID = new Coordinates(22.5937, 78.9629);

    private final Map<String, List<CityRecord>> citiesByName = new HashMap<>();
    private final Map<String, Coordinates> stateCentroids = new HashMap<>();

    public CityGeocoder() {
        registerStates();
        registerCities();
    }

    public Coordinates resolve(String city, String state, Double latitude, Double longitude) {
        if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
            return new Coordinates(latitude, longitude);
        }

        String cityKey = normalize(city);
        String stateKey = normalize(state);

        if (!cityKey.isEmpty()) {
            List<CityRecord> matches = citiesByName.get(cityKey);
            if (matches != null && !matches.isEmpty()) {
                CityRecord preferred = pickCity(matches, stateKey);
                return new Coordinates(preferred.latitude(), preferred.longitude());
            }
        }

        if (!stateKey.isEmpty()) {
            Coordinates centroid = stateCentroids.get(stateKey);
            if (centroid != null) {
                return centroid;
            }
        }

        return INDIA_CENTROID;
    }

    private CityRecord pickCity(List<CityRecord> matches, String stateKey) {
        if (!stateKey.isEmpty()) {
            for (CityRecord match : matches) {
                if (stateKey.equals(match.stateKey())) {
                    return match;
                }
            }
        }
        return matches.get(0);
    }

    private void registerStates() {
        putState("andhra pradesh", 15.9129, 79.7400);
        putState("arunachal pradesh", 28.2180, 94.7278);
        putState("assam", 26.2006, 92.9376);
        putState("bihar", 25.0961, 85.3131);
        putState("chhattisgarh", 21.2787, 81.8661);
        putState("goa", 15.2993, 74.1240);
        putState("gujarat", 22.2587, 71.1924);
        putState("haryana", 29.0588, 76.0856);
        putState("himachal pradesh", 31.1048, 77.1734);
        putState("jharkhand", 23.6102, 85.2799);
        putState("karnataka", 15.3173, 75.7139);
        putState("kerala", 10.8505, 76.2711);
        putState("madhya pradesh", 22.9734, 78.6569);
        putState("maharashtra", 19.7515, 75.7139);
        putState("manipur", 24.6637, 93.9063);
        putState("meghalaya", 25.4670, 91.3662);
        putState("mizoram", 23.1645, 92.9376);
        putState("nagaland", 26.1584, 94.5624);
        putState("odisha", 20.9517, 85.0985);
        putState("orissa", 20.9517, 85.0985);
        putState("punjab", 31.1471, 75.3412);
        putState("rajasthan", 27.0238, 74.2179);
        putState("sikkim", 27.5330, 88.5122);
        putState("tamil nadu", 11.1271, 78.6569);
        putState("telangana", 18.1124, 79.0193);
        putState("tripura", 23.9408, 91.9882);
        putState("uttar pradesh", 26.8467, 80.9462);
        putState("uttarakhand", 30.0668, 79.0193);
        putState("uttaranchal", 30.0668, 79.0193);
        putState("west bengal", 22.9868, 87.8550);
        putState("delhi", 28.6139, 77.2090);
        putState("nct of delhi", 28.6139, 77.2090);
        putState("new delhi", 28.6139, 77.2090);
        putState("jammu and kashmir", 33.7782, 76.5762);
        putState("ladakh", 34.1526, 77.5771);
        putState("chandigarh", 30.7333, 76.7794);
        putState("puducherry", 11.9416, 79.8083);
        putState("pondicherry", 11.9416, 79.8083);
        putState("andaman and nicobar islands", 11.7401, 92.6586);
        putState("andaman and nicobar", 11.7401, 92.6586);
        putState("dadra and nagar haveli and daman and diu", 20.1809, 73.0169);
        putState("daman and diu", 20.4283, 72.8397);
        putState("lakshadweep", 10.5667, 72.6417);
    }

    private void registerCities() {
        putCity("Mumbai", "Maharashtra", 19.0760, 72.8777, "Bombay");
        putCity("Delhi", "Delhi", 28.7041, 77.1025);
        putCity("New Delhi", "Delhi", 28.6139, 77.2090);
        putCity("Bengaluru", "Karnataka", 12.9716, 77.5946, "Bangalore");
        putCity("Hyderabad", "Telangana", 17.3850, 78.4867);
        putCity("Ahmedabad", "Gujarat", 23.0225, 72.5714);
        putCity("Chennai", "Tamil Nadu", 13.0827, 80.2707, "Madras");
        putCity("Kolkata", "West Bengal", 22.5726, 88.3639, "Calcutta");
        putCity("Surat", "Gujarat", 21.1702, 72.8311);
        putCity("Pune", "Maharashtra", 18.5204, 73.8567, "Poona");
        putCity("Jaipur", "Rajasthan", 26.9124, 75.7873);
        putCity("Lucknow", "Uttar Pradesh", 26.8467, 80.9462);
        putCity("Kanpur", "Uttar Pradesh", 26.4499, 80.3319);
        putCity("Nagpur", "Maharashtra", 21.1458, 79.0882);
        putCity("Indore", "Madhya Pradesh", 22.7196, 75.8577);
        putCity("Thane", "Maharashtra", 19.2183, 72.9781);
        putCity("Bhopal", "Madhya Pradesh", 23.2599, 77.4126);
        putCity("Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, "Vizag");
        putCity("Patna", "Bihar", 25.5941, 85.1376);
        putCity("Vadodara", "Gujarat", 22.3072, 73.1812, "Baroda");
        putCity("Ghaziabad", "Uttar Pradesh", 28.6692, 77.4538);
        putCity("Ludhiana", "Punjab", 30.9010, 75.8573);
        putCity("Agra", "Uttar Pradesh", 27.1767, 78.0081);
        putCity("Nashik", "Maharashtra", 19.9975, 73.7898);
        putCity("Faridabad", "Haryana", 28.4089, 77.3178);
        putCity("Meerut", "Uttar Pradesh", 28.9845, 77.7064);
        putCity("Rajkot", "Gujarat", 22.3039, 70.8022);
        putCity("Varanasi", "Uttar Pradesh", 25.3176, 82.9739, "Banaras", "Benares");
        putCity("Srinagar", "Jammu and Kashmir", 34.0837, 74.7973);
        putCity("Aurangabad", "Maharashtra", 19.8762, 75.3433, "Chhatrapati Sambhajinagar");
        putCity("Dhanbad", "Jharkhand", 23.7957, 86.4304);
        putCity("Amritsar", "Punjab", 31.6340, 74.8723);
        putCity("Navi Mumbai", "Maharashtra", 19.0330, 73.0297);
        putCity("Prayagraj", "Uttar Pradesh", 25.4358, 81.8463, "Allahabad");
        putCity("Ranchi", "Jharkhand", 23.3441, 85.3096);
        putCity("Howrah", "West Bengal", 22.5958, 88.2636);
        putCity("Coimbatore", "Tamil Nadu", 11.0168, 76.9558);
        putCity("Jabalpur", "Madhya Pradesh", 23.1815, 79.9864);
        putCity("Gwalior", "Madhya Pradesh", 26.2183, 78.1828);
        putCity("Vijayawada", "Andhra Pradesh", 16.5062, 80.6480);
        putCity("Jodhpur", "Rajasthan", 26.2389, 73.0243);
        putCity("Madurai", "Tamil Nadu", 9.9252, 78.1198);
        putCity("Raipur", "Chhattisgarh", 21.2514, 81.6296);
        putCity("Kota", "Rajasthan", 25.2138, 75.8648);
        putCity("Guwahati", "Assam", 26.1445, 91.7362);
        putCity("Chandigarh", "Chandigarh", 30.7333, 76.7794);
        putCity("Solapur", "Maharashtra", 17.6599, 75.9064);
        putCity("Hubli", "Karnataka", 15.3647, 75.1240, "Hubballi");
        putCity("Bareilly", "Uttar Pradesh", 28.3670, 79.4304);
        putCity("Moradabad", "Uttar Pradesh", 28.8389, 78.7768);
        putCity("Mysuru", "Karnataka", 12.2958, 76.6394, "Mysore");
        putCity("Gurugram", "Haryana", 28.4595, 77.0266, "Gurgaon");
        putCity("Aligarh", "Uttar Pradesh", 27.8974, 78.0880);
        putCity("Jalandhar", "Punjab", 31.3260, 75.5762);
        putCity("Tiruchirappalli", "Tamil Nadu", 10.7905, 78.7047, "Trichy");
        putCity("Bhubaneswar", "Odisha", 20.2961, 85.8245);
        putCity("Salem", "Tamil Nadu", 11.6643, 78.1460);
        putCity("Warangal", "Telangana", 17.9689, 79.5941);
        putCity("Guntur", "Andhra Pradesh", 16.3067, 80.4365);
        putCity("Noida", "Uttar Pradesh", 28.5355, 77.3910);
        putCity("Greater Noida", "Uttar Pradesh", 28.4744, 77.5040);
        putCity("Jamshedpur", "Jharkhand", 22.8046, 86.2029);
        putCity("Cuttack", "Odisha", 20.4625, 85.8830);
        putCity("Kochi", "Kerala", 9.9312, 76.2673, "Cochin");
        putCity("Thiruvananthapuram", "Kerala", 8.5241, 76.9366, "Trivandrum");
        putCity("Kozhikode", "Kerala", 11.2588, 75.7804, "Calicut");
        putCity("Dehradun", "Uttarakhand", 30.3165, 78.0322);
        putCity("Shimla", "Himachal Pradesh", 31.1048, 77.1734);
        putCity("Jammu", "Jammu and Kashmir", 32.7266, 74.8570);
        putCity("Leh", "Ladakh", 34.1526, 77.5771);
        putCity("Udaipur", "Rajasthan", 24.5854, 73.7125);
        putCity("Ajmer", "Rajasthan", 26.4499, 74.6399);
        putCity("Bikaner", "Rajasthan", 28.0229, 73.3119);
        putCity("Mangaluru", "Karnataka", 12.9141, 74.8560, "Mangalore");
        putCity("Belagavi", "Karnataka", 15.8497, 74.4977, "Belgaum");
        putCity("Nashik", "Maharashtra", 19.9975, 73.7898);
        putCity("Kolhapur", "Maharashtra", 16.7050, 74.2433);
        putCity("Panaji", "Goa", 15.4909, 73.8278, "Panjim");
        putCity("Puducherry", "Puducherry", 11.9416, 79.8083, "Pondicherry");
        putCity("Imphal", "Manipur", 24.8170, 93.9368);
        putCity("Aizawl", "Mizoram", 23.7271, 92.7176);
        putCity("Kohima", "Nagaland", 25.6751, 94.1086);
        putCity("Shillong", "Meghalaya", 25.5788, 91.8933);
        putCity("Agartala", "Tripura", 23.8315, 91.2868);
        putCity("Itanagar", "Arunachal Pradesh", 27.0844, 93.6053);
        putCity("Gangtok", "Sikkim", 27.3389, 88.6065);
        putCity("Port Blair", "Andaman and Nicobar Islands", 11.6234, 92.7265);
        putCity("Siliguri", "West Bengal", 26.7271, 88.3953);
        putCity("Durgapur", "West Bengal", 23.5204, 87.3119);
        putCity("Asansol", "West Bengal", 23.6739, 86.9524);
        putCity("Gaya", "Bihar", 24.7914, 85.0002);
        putCity("Muzaffarpur", "Bihar", 26.1209, 85.3647);
        putCity("Bhagalpur", "Bihar", 25.2425, 86.9842);
        putCity("Rourkela", "Odisha", 22.2604, 84.8536);
        putCity("Jalgaon", "Maharashtra", 21.0077, 75.5626);
        putCity("Amravati", "Maharashtra", 20.9374, 77.7796);
        putCity("Nanded", "Maharashtra", 19.1383, 77.3210);
        putCity("Ujjain", "Madhya Pradesh", 23.1765, 75.7885);
        putCity("Jhansi", "Uttar Pradesh", 25.4484, 78.5685);
        putCity("Saharanpur", "Uttar Pradesh", 29.9680, 77.5552);
        putCity("Haridwar", "Uttarakhand", 29.9457, 78.1642);
        putCity("Rishikesh", "Uttarakhand", 30.0869, 78.2676);
        putCity("Manali", "Himachal Pradesh", 32.2396, 77.1887);
        putCity("Dharamshala", "Himachal Pradesh", 32.2190, 76.3234);
        putCity("Tirupati", "Andhra Pradesh", 13.6288, 79.4192);
        putCity("Nellore", "Andhra Pradesh", 14.4426, 79.9865);
        putCity("Kakinada", "Andhra Pradesh", 16.9891, 82.2475);
        putCity("Warangal", "Telangana", 17.9689, 79.5941);
        putCity("Vellore", "Tamil Nadu", 12.9165, 79.1325);
        putCity("Tirunelveli", "Tamil Nadu", 8.7139, 77.7567);
        putCity("Erode", "Tamil Nadu", 11.3410, 77.7172);
        putCity("Thrissur", "Kerala", 10.5276, 76.2144);
        putCity("Kannur", "Kerala", 11.8745, 75.3704);
        putCity("Bhavnagar", "Gujarat", 21.7645, 72.1519);
        putCity("Jamnagar", "Gujarat", 22.4707, 70.0577);
        putCity("Gandhinagar", "Gujarat", 23.2156, 72.6369);
        putCity("Dwarka", "Gujarat", 22.2442, 68.9685);
        putCity("Hisar", "Haryana", 29.1492, 75.7217);
        putCity("Panipat", "Haryana", 29.3909, 76.9635);
        putCity("Karnal", "Haryana", 29.6857, 76.9905);
        putCity("Sonipat", "Haryana", 28.9931, 77.0151);
        putCity("Rohtak", "Haryana", 28.8955, 76.6066);
        putCity("Ambala", "Haryana", 30.3782, 76.7767);
        putCity("Panchkula", "Haryana", 30.6942, 76.8606);
    }

    private void putState(String name, double latitude, double longitude) {
        stateCentroids.put(normalize(name), new Coordinates(latitude, longitude));
    }

    private void putCity(String city, String state, double latitude, double longitude, String... aliases) {
        CityRecord record = new CityRecord(normalize(city), normalize(state), latitude, longitude);
        addCityAlias(normalize(city), record);
        for (String alias : aliases) {
            addCityAlias(normalize(alias), record);
        }
    }

    private void addCityAlias(String key, CityRecord record) {
        citiesByName.computeIfAbsent(key, ignored -> new ArrayList<>()).add(record);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static boolean isValidLatitude(Double latitude) {
        return latitude != null && !latitude.isNaN() && latitude >= -90.0 && latitude <= 90.0;
    }

    private static boolean isValidLongitude(Double longitude) {
        return longitude != null && !longitude.isNaN() && longitude >= -180.0 && longitude <= 180.0;
    }

    private record CityRecord(String cityKey, String stateKey, double latitude, double longitude) {
    }
}
