PerficientCCPApp.factory("CountryCodesHolder", function() {
    return {
        value: {
            callableCountries: ["il", "ca", "de", "sg", "hk", "au", "cn", "mx", "gb", "se", "us", "jp"],
            countryCodesToDialCodes: {
                "il": "+972",
                "ca": "+1",
                "de": "+49",
                "sg": "+65",
                "hk": "+852",
                "au": "+61",
                "cn": "+86",
                "mx": "+52",
                "gb": "+44",
                "se": "+46",
                "us": "+1",
                "jp": "+81"
            },
            countryISOCodesToCountryNames: {
                "il": "Israel",
                "ca": "Canada",
                "de": "Germany",
                "sg": "Singapore",
                "hk": "Hong Kong",
                "au": "Australia",
                "cn": "China",
                "mx": "Mexico",
                "gb": "United Kingdom",
                "se": "Sweden",
                "us": "United States",
                "jp": "Japan"
            },
            countryNamesToCountryISOCodes: {
                "Israel": "il",
                "Canada": "ca",
                "Germany": "de",
                "Singapore": "sg",
                "Hong Kong": "hk",
                "Australia": "au",
                "China": "cn",
                "Mexico": "mx",
                "United Kingdom": "gb",
                "Sweden":"se",
                "United States": "us",
                "Japan": "jp"
            }
        }
};
});