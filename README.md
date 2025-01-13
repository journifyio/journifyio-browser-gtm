# journifyio-browser-gtm
The Journify browser template for Google Tag manager.


### Cookie Keeper Setup Instructions

1. User Defined Variable
    1. Add new user-defined variable named `journify_user_agent`
    2. Variable Type: JavaScript Variable
    3. Global Variable Name: `navigator.userAgent`
2. Update *Journify Tracker* Tag Template
    1. Under *Additional Init Options*
        1. Set *Cookie Keeper host*
    2. Under *Permissions Tab*
        1. Open *Injects scripts*
        2. Add new URL with `{{cookie_keeper_host}}/*`
        3. Save template
3. Update Google GA4 Tag (Tag Sequencing)
    1. Open *Tags* page
        1. Look for *Google GA4* tag and open it
        2. Under *Advanced Settings*
            1. Under *Tag Sequencing*
                1. Check *Fire a tag before Google GA4fires*
                2. Choose *Journify - init tag* in *Setup Tag*
        3. Save tag