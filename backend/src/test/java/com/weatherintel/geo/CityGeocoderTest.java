package com.weatherintel.geo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class CityGeocoderTest {

    private final CityGeocoder geocoder = new CityGeocoder();

    @Test
    void usesProvidedCoordinatesWhenPresent() {
        CityGeocoder.Coordinates coords = geocoder.resolve("Gurugram", "Haryana", 28.4, 77.0);
        assertEquals(28.4, coords.latitude());
        assertEquals(77.0, coords.longitude());
    }

    @Test
    void looksUpMajorCityWhenCoordinatesMissing() {
        CityGeocoder.Coordinates coords = geocoder.resolve("Gurgaon", "Haryana", null, null);
        assertEquals(28.4595, coords.latitude());
        assertEquals(77.0266, coords.longitude());
    }

    @Test
    void fallsBackToStateCentroidWhenCityUnknown() {
        CityGeocoder.Coordinates coords = geocoder.resolve("Unknown Hamlet", "Kerala", null, null);
        assertEquals(10.8505, coords.latitude());
        assertEquals(76.2711, coords.longitude());
    }

    @Test
    void neverReturnsNullCoordinates() {
        CityGeocoder.Coordinates coords = geocoder.resolve(null, null, null, null);
        assertNotNull(coords);
        assertEquals(22.5937, coords.latitude());
        assertEquals(78.9629, coords.longitude());
    }
}
