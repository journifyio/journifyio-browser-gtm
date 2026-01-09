# journifyio-browser-gtm
The Journify browser template for Google Tag manager.


### Development

To add features, fix bugs or just change something in this template. follow these instructions:

1. Login to a GTM account. If you haven't done yet, create a test container. (**DO NOT USE A CLIENT CONTAINER**)
2. Navigate to `Templates > Tag Templates > New`
3. On the top-right corner, click on the **ellipsis button**. Then click **Import** and import the `template.tpl` file.
4. Make your changes
5. To test your changes; [follow these instructions from our docs](https://docs.journify.io/sources/google-tag-manager-browser-template). But make sure you choose the template that you just edited. Not the official Journify's one. After that you can simply test your container on a dummy website (typically a fake html file on your local).
6. Once done testing. Go back to `Templates > Tag Templates > <YOUR TEMPLATE>`; and On the top-right corner, click on the **ellipsis button**. Then click **Export** and replace the `template.tpl` file with your new one.
7. Commit your changes and open a PR.


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