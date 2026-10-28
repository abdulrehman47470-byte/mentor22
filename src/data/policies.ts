// Policy pages, word for word from the current server copy (admin.mentorandmatch.com).
// Legal wording is kept exactly as published; only the client should change it.
// Format: "# " heading, "## " sub-heading, "- " bullet, any other line is a paragraph.

const CODE_OF_CONDUCT = `The Student Code of Conduct sets out the standards of conduct expected of students at the institution of enrollment. It holds individuals and groups responsible for the consequences of their actions, which extends to the Mentor & Match Corporation mentor networking platform. Failure to fulfill these responsibilities and/or violation of, may result in the withdrawal of privileges from Mentor & Match Corporation or the imposition of sanctions from institution of enrollment.`;

const FERPA = `As part of the its services Mentor & Match Corporation provides an access point for students (mentees) to speak privately with members of college (mentors). Mentor & Match Corporation takes student information protection very seriously. Notwithstanding the rest of this Privacy Policy, no one will have access to, nor will we disclose any information from, a student educational record without the written consent of the student
The one exception to this policy is that we may disclose such information to authorized representatives of the federal and state governments for audit and evaluation of federal and state supported programs, or other provisions outlined by the FERPA document :http://www2.ed.gov/policy/gen/reg/ferpa/index.html
As detailed above, our mentor networking platform is developed with security in mind. We encrypt and secure all files hosted. All Mentor & Match server certificates are signed by a recognized Certificate authority (DigiCert) and we use 256-bit SSL encryption for all web communication. All communication amongst the database, application, and authentication servers is also conducted via secure connections.`;

const SECURITY = `Mentor & Match Corporation takes reasonable administrative, physical and electronic measures to safeguard your Personal Information from unauthorized access or inappropriate use by third parties. Please be aware, however, that no method of transmitting and storing information over the internet is completely secure. Accordingly, we cannot guarantee the absolute security of any information and you should ensure that you do not post sensitive information, including personality profiles, to the Mentor & Match site.
Moreover, one of our primary purposes is to provide you with a platform to broadcast the information in your resume and profile widely in order to maximize your academic opportunities. Such an environment does present a risk that unauthorized third parties will view this data. Thus, you should take care to ensure that your resume does not contain any sensitive data that you would not want made public.`;

const CONTENT_RULES = [
  'Involve activities that are illegal, obscene, threatening, defamatory, invade privacy, infringe intellectual property rights, or otherwise injure third parties or are objectionable.',
  'Use a false e-mail address, impersonate any person or entity, or otherwise mislead us as to your identity',
  'Promote violence or discrimination based on race, sex, religion, nationality, disability, sexual orientation, or age.',
  'Infringe any copyright, patent, trademark, trade secret, or other intellectual property or other rights of any other person.',
  'Violate the legal rights (including the rights of publicity and privacy) of others or contain any material that could give rise to any civil or criminal liability under applicable laws or regulations or that otherwise may be in conflict with this agreement or our Privacy Policy.',
  'In any way likely to deceive any person.',
  'Promote or solicit any illegal activity, or advocate, promote, or assist any unlawful act.',
  'Cause annoyance, inconvenience, or needless anxiety or be likely to upset, embarrass, alarm, or annoy any other person.',
  'Impersonate any person or misrepresent your identity or affiliation with any person or organization.',
  'Involve commercial activities or sales, such as contests, sweepstakes, and other sales promotions, barter, or advertising.',
  'Give the impression that they emanate from or are endorsed by us or any other person or entity, if that is not the case.',
  'Contain viruses, worms, Trojan horses, or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software, hardware, mobile device, or telecommunications equipment.',
  'Depict private or personal information of any person without their written consent.',
  'Request personal information from or share personal information with any user, including financial information, email address, telephone number, or mailing address.',
  'Request money from, or otherwise defraud other Service users.',
].map((r) => `- ${r}`).join('\n');

const COMMUNICATIONS = `# Communications and Content
You are responsible for the content of the messages you communicate when using our Services as well as the consequences of those messages. You agree that your content will not:
${CONTENT_RULES}`;

const conductRules = (stalk: string) => `# Rules of Conduct While Using Our Website and Services
All users of our Website and Services understand and agree to the following rules of conduct while using our Website and/or Services:
${[
  'You agree to use our Website, its content, and our Services solely for their intended purposes and solely for lawful purposes.',
  'You agree to abide by this Agreement which you acknowledged at the time of registering for our Services and with any updates or amendments that may be included from time to time by Mentor & Match Corporation.',
  'You agree to not in any way attempt to use any method to gain unauthorized access to any paid features of our Website.',
  'You agree to not copy, print (except for personal use), republish, display, distribute, transmit, sell, rent, lease, loan or otherwise make available in any form or by any means all or any portion of our Website, its content, and our Services.',
  'You agree to not use our Website or any content obtained from it to develop, of use as a component of, any information, storage and retrieval system, database, information base, or similar resource (in any media now existing or hereafter developed), that is offered for commercial distribution of any kind, including through sale, license, lease, rental, subscription, or any other commercial distribution mechanism.',
  'You agree to not use automated scripts to collect information from or otherwise interact with the Services or our Website.',
  `You agree to not use our Website or Services to ${stalk} or otherwise harass another person.`,
  'You agree to not harvest or collect email addresses or other contact information from users of our Website and Services for the purposes of sending unsolicited emails or other unsolicited communications.',
  'You agree not to send, knowingly receive, upload, download, use, or re-use any material which does not comply with the Student Code of Conduct stated in this Agreement.',
  'You agree not to impersonate or try to impersonate us, our employee, another user, or any other person or entity (including by using email addresses or usernames associated with any of the preceding).',
  'You agree not to use the Service in any way that could disable, overburden, damage, or impair the Service or interfere with any other person’s use of the Service, including their ability to engage in real-time activities through the Service.',
  'You agree not to use any robot, spider, or other automatic device, process, or means to access the Service for any purpose.',
  'You agree not to use any device, software, or routine that interferes with the proper working of the Service.',
  'You agree not to introduce any viruses, Trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful.',
  'You agree not to attack the Service via a denial-of-service attack or a distributed denial-of-service attack.',
  'You agree not to otherwise try to interfere with the Service’s proper working.',
].map((r) => `- ${r}`).join('\n')}
# Student Code of Conduct
${CODE_OF_CONDUCT}`;

const PRIVACY = `Mentor & Match Corporation is committed to protecting the privacy of our users, and strives to provide a safe, secure user experience.
This Privacy Statement sets forth the online data collection and usage policies and practices that apply to this website, its associated community sites, and the Mentor & Match Connect mobile application (collectively the “Sites”) This privacy policy does not apply to any third-party websites, service or applications, even if they are accessible through the Sites.
By registering or using the Sites, you agree to the processing activities set forth in this Privacy Policy with respect to your Personal Information
# Revisions to this Privacy Policy
Any information that is collected via our Site is covered by the Privacy Policy in effect at the time such information is collected.
We may revise this Privacy Policy from time to time. When we do so, we will update the “Last Updated Date” above to indicate when those changes will become effective.
# Collection and Use of Information
## Information Collected or Received from You
Our primary goals in collecting information are to provide and improve the Sites, to administer your use of the Sites, to enable you to enjoy and easily navigate the Sites, to respond to your inquiries submitted via the Sites, and to periodically send you free newsletters and emails that directly promote our Sites and our services in response to your request. To achieve these goals, we may collect information that is related to you as an identified or identifiable person (hereinafter “Personal Information” or “PI”).
We use this information for the purposes of providing our services, responding to any queries you may have, operating and improving the web site, fostering a positive user experience and delivering the products and services that we offer.
As a result of the information that we collect about you, we are able to provide you with personalized product suggestions, content, and advertising relating to your interests.
The information we gathered on any Mentor & Match web site may be shared within Mentor & Match on a worldwide basis in order to deliver these products and services.
# This Information May Include
Contact Information: Depending on how you choose to use the Sites, you may provide us with contact information such as your: name, physical address, email address, or telephone number.
Device Information: Depending on how you access the site, we may collect information regarding the type of device on which the Sites are used or downloaded, the operating system name and version of the device used to access the Sites, device manufacturer, application version accessed on your device, device ID, IP address, and geolocation data.
Information about third parties: Examples includes references or contacts that you provide to us if you have their express written consent to do so.
Demographic Information: We may collect certain information about population characteristics from you. This information includes your zip code or postal code, age, preferences, gender, race or ethnicity, occupation, career history, interests and favorites. We do not consider this information to be PI given that it will be deidentified and anonymized such that it cannot be linked to you as an individual.
Inferential Information: We may use information you provide to make certain inferences. For example, if you provide a title of ‘Ms.’ we will assume you are female.
Information Collected Using Cookies and other Web Technologies. Like many website owners and operators, we use automated data collection tools such as Cookies and Web Beacons to collect certain information.
“Cookies” are small text files that are placed on your hard drive by a Web server when you access our Site.
We may use both session Cookies and persistent Cookies to identify that you’ve logged in to the Site and to tell us how and when you interact with our Site.
We may also use Cookies to monitor aggregate usage and web traffic routing on our Site and to customize and improve our Site. Unlike persistent Cookies, session Cookies are deleted when you log off from the Site and close your browser.
Although most browsers automatically accept Cookies, you can change your browser options to stop automatically accepting Cookies or to prompt you before accepting Cookies.
Please note, however, that if you don’t accept Cookies, you may not be able to access all portions or features of the Site. Some third-party service providers that we engage (including third-party advertisers) may also place their own Cookies on your hard drive.
Note that this Privacy Policy covers only our use of Cookies and does not include use of Cookies by such third parties.
“Web Beacons” (also known as Web bugs, pixel tags or clear GIFs) are tiny graphics with a unique identifier that may be included on our Site for several purposes, including to deliver or communicate with Cookies, to track and measure the performance of our Site, to monitor how many visitors view our Site, and to monitor the effectiveness of our advertising.
Unlike Cookies, which are stored on the user’s hard drive, Web Beacons are typically embedded invisibly on web pages (or in an email).
# Information About You Provided By Third Parties
In certain instances, we may also acquire Personal Information (including personal, demographic, behavioral and indirect information) about you from third parties with whom we have a business relationship.
# How Information Is Used
Once you provide us with your Personal Information, we may use it in the following ways:
- To allow you to create an account;
- To create a profile for you based on information that you have provided to us;
- To contact you about Site updates, informational and service-related communications, including important security updates;
- To provide you additional communications, information, and promotions such as newsletters and career advice;
- To inform you of other products or services available from Mentor & Match Corporation or its affiliates (“Affiliates” means entities that control, are controlled by or are under common control with Mentor & Match); to enable you to provide feedback, to contact us and for us to respond to you;
- To conduct surveys, questionnaires, promotions and contests, and to provide the results thereof such as success stories and contest winners;
- To provide products and services that enable users to network, post information on bulletin boards, view and compare profiles, and career background and experience;
- To determine whether you might be interested in the opportunities, products or services of a particular third party.
- To generate internal reports about the use of our site; and
- To provide ‘forward to a friend’ features.
# Information That We Share With Third Parties
We will not share any PI that we have collected from or about you with any third party except as described in this Privacy Policy.
## Information Shared in Order to Provide our Services
The nature of some of the services we offer is such that third parties may be able to view your Personal Information and contact you. For example, profile information may be used for networking with other community members or may be visible to employers who are using the Mentor & Match website. In addition, portions of your searchable resume (but not your contact information) may be made public in your networking profile. Likewise, we may supply your contact information to select third parties such as employers, recruiters, data aggregators, marketers or others for the purpose of sending you email or otherwise communicating with you.
## Information Shared with Our Service Providers
We may engage third-party services providers to work with us to administer and provide the Site and to respond to your Requests. These third-party services providers have access to your PI only for the purpose of performing services on our behalf. Examples include hosting our web servers, analyzing data, providing marketing assistance, processing credit card payments, and providing customer service. These companies and individuals may be located in a country whose data protection legislation is different from your country, and they will have access to your Personal Information as necessary to perform their functions, but they may not share that PI with any other third party or use that data for any other purpose.
## Information Disclosed in Connection with Business Transactions
Information that we collect from our users, including PI, is considered to be a business asset. Thus, if we are acquired by a third party as a result of a transaction such as a merger, acquisition or asset sale or if our assets are acquired by a third party in the event we go out of business or enter bankruptcy, some or all of our assets, including your PI, may be disclosed or transferred to a third-party acquirer in connection with the transaction.
## Information Disclosed for Our Protection and the Protection of Others
We may disclose your PI if legally required to do so, pursuant to a request from a governmental entity, or if we believe in good faith – after considering your privacy interests and other factors – that such action is necessary to:
- Conform to legal requirements or comply with legal processes (including subpoenas);
- Protect our property rights, rights and safety or property, rights and safety of a third party, our affiliated companies, or the public in general; or
- Stop any activity that we consider illegal, unethical, or legally actionable.
## Information Disclosed to Others in Accordance with Your Preferences
We may disclose such PI to third parties if you consent to such disclosure. For example, when configuring your profile, you may have the option to indicate that you would like to receive information about the opportunities, products or services of third parties.
## Information Disclosed in an Aggregated or Anonymized Manner
We also share aggregated anonymous information about visitors to the Sites with Mentor & Match clients, partners, other site visitors, and other third parties so that they can understand the kinds of visitors to the sites and how those visitors use the sites in order to serve advertisements to you on our sites or other sites with which we have a business relationship.
# International Transfer
Your PI may be transferred to, and maintained on, computers located outside of your state, province, country or other governmental jurisdiction where the privacy laws may not be as protective as those in your jurisdiction. If you’re located outside the United States and choose to provide your PI to us, we may transfer your PI to the United States and process it there.
# Your Choices About Your Information
We offer you choice regarding the collection, use, and sharing of your PI and we respect the decisions that you make. Please note that prior to responding to your requests pursuant to your choices below, we reserve the right to verify and authenticate your identity and the PI to which you have requested access.
Your privacy is important to us and to demonstrate our commitment, we do our best to honor requests to access, correct, update, or delete your PI. Please note, however, that to the extent that your request would violate another person’s rights and/or as otherwise permitted by applicable law, Mentor & Match may deny the request.
If you wish to delete or close your account or account profile information altogether, please contact us. An email will be sent to you to confirm that your Personal Information has been deleted (save for an archival copy which is not accessible by you or third parties on the Internet).
Please note that in the event that you decide to delete your data, we may retain an archival copy only for as long as Mentor & Match reasonably considers necessary for audit and record purposes.
# Important Information (Security)
${SECURITY}
# Our Policy Toward Children
Our Site is not directed to children under 17 and we do not knowingly collect PI from children under 17. If we learn that we have collected PI of a child under 17 we will take steps to delete such information from our files as soon as possible.
## Contact Information
To exercise your rights above or to make any other inquiries, please contact us at: Mentor & Match Corporation Privacy Office 2785 Pacific Coast Highway #171 Torrance CA 90505
# Your Family Education Rights And Privacy Act (FERPA) Rights
${FERPA}
# Your California Rights
## Scope of this Privacy Notice
This privacy notice describes the Personal Information we collect or process about California residents in connection with our Site, how we use, share, and protect that Personal Information, and what your rights are concerning Personal Information that we collect or process.
In this privacy notice, “Personal Information” has the same meaning as under the California Consumer Privacy Act (CCPA), California Civil Code Section 1798.83: information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or household. Personal Information does not include information that has been de-identified or aggregated.
## Personal Information We Collect and Share, and For What Purpose
In the past 12 months, we have collected and/or shared the following Personal Information of visitors when they interact with our Site, as described in detail above:
- Information we Collect from You
- Information Collected Using Cookies and Web Technologies
- Information Shared in Order to Provide our Services
- Information Shared with Our Service Providers
- Information Disclosed in Connection with Business Transactions
- Information Disclosed for Our Protection and the Protection of Others
- Information Disclosed to Others in Accordance with Your Preferences
- Information Disclosed to Others in Accordance with Your Preferences
As described in detail above, we use your Personal Information for a variety of purposes to operate, assess activity on, and improve the performance of our Site, including the following:
- To administer and provide the Site
- For research and development To communicate with you about our Site
- To market, promote, and drive engagement with our Site
- For Customer support
- For safety and security
- To protect our legitimate business interests and legal rights
To protect our legitimate business interests and legal rights
We do not share your Personal Information with third parties for third party marketing purposes without your consent.
## Your Rights as a California Resident
Under California law, users who are California residents have specific rights regarding their Personal Information. These rights are subject to certain exceptions described below. When required, we will respond to most requests within 45 days unless it is reasonably necessary to extend the response time.
## Right to Disclosure of Information
You have the right to request that we disclose certain information regarding our practices with respect to Personal Information. If you submit a valid and verifiable request and we confirm your identity and/or authority to make the request, we will disclose to you any of the following at your direction:
- The categories of Personal Information we have collected about you in the last 12 months
- The categories of sources for the Personal Information we have collected about you in the last 12 months.
- Our business or commercial purpose for collecting that Personal Information.
- The categories of third parties with whom we share that Personal Information.
- The specific pieces of Personal Information we collected about you.
- If we disclosed your Personal Information to a third party for a business purpose, a list of the Personal Information types that each category of recipient received.
## Right to Delete Personal Information
You have the right to request that we delete any of your Personal Information collected from you and retained, subject to certain exceptions. Upon receiving a verified request to delete your Personal Information, we will do so unless otherwise authorized by law.
## How to Exercise these Rights
You may submit a verifiable consumer request to us for disclosure or deletion of Personal Information by clicking here support@mentorandmatch.com
Alternatively, you may call us at (310) 435-8447
We will respond to verifiable requests for disclosure or deletion of Personal Information free of charge, within 10 days of receipt.
In order to protect your privacy and the security of your information, we verify consumer requests by personally contacting the requestor. Any additional information you provide will be used only to verify your identity and not for any other purpose.
You may designate an authorized agent to make requests on your behalf. You must provide an authorized agent written permission to submit a request on your behalf, and we may require that you verify your identity directly with us. Alternatively, an authorized agent that has been provided power of attorney under Probate Code sections 4000-4465 may submit a request on your behalf.
## Right to Opt Out of Sales of Your Personal Information
You have a right to opt-out of the sale of your Personal Information. You may, at any time, direct businesses that sell your Personal Information to third parties not to sell your Personal Information.
We do not sell your Personal Information and therefore do not provide any mechanism for you to exercise the right to opt out.
## Right to Non-Discrimination
You have the right not to be discriminated against for the exercise of your California privacy rights described above`;

const TERMS = `Please read this terms-of-service agreement (this “Agreement”), which is a legal agreement between you and Mentor & Match Corporation (Mentor & Match, “us” or “we”) that governs your use of this service (the “Service”), including any content, functionality, and services offered on or through the Service. You may access the Service only if you agree to this agreement.
We are not liable for anything that you post or say while you are on the Service. We don’t monitor the content posted to the Service, but if we do see, or someone tells us that you’ve posted, something that we consider inappropriate or offensive, we will remove it and may take appropriate action against you.
We may change this agreement on one or more occasions by updating this page. The top of this page will tell you when we last updated this agreement. Changes take effect on the “last updated” date stated on the top of this page. We will consider your continued use of the Service after we post the changes as your acceptance of the changes even if you do not read them. If you do not agree to the changes, your sole remedy is to cancel your account and stop accessing the Service.
We may withdraw or amend our Service, and any service or material provided on it, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of the Service, or the entire Service, to users, including registered users.
By visiting Mentor & Match Corporation's website (hereinafter the "Website"), subscribing to Mentor & Match Corporation’s Services, and/or utilizing the Services, you are indicating that you have read, understood, and agree to be bound by the terms of this Agreement. The Mentor & Match Corporation may refuse access to the Services for noncompliance with any part of this Agreement.
This Agreement may be updated or amended by us from time to time without notice to you. Please check back periodically to learn of any updates or amendments. When using the Services, you shall be subject to any posted guidelines or rules applicable to such services which may be posted from time to time. All such guidelines or rules are hereby incorporated by reference into this Agreement.
# Privacy Policy
A complete statement of our privacy policy can be found at https://www.mentorandmatch.com/terms
# Ownership
The Services, our technology, and any updates or improvements to the Services and/or our technology, are owned by Mentor & Match Corporation and its licensors. Mentor & Match Corporation and its licensors own all copyrights, patents, trademarks, trade secrets, and other intellectual property rights relating to or residing in our Services.
You understand that our Services and technology contain valuable software and confidential information and you agree that you will not copy, modify, reverse engineer, de-compile, attempt to derive the source code of, create other works from, or disassemble any of our software without our prior written consent. Mentor & Match Corporation reserves all rights not expressly granted to you.
Our name and logo; the Service’s logo; and all related names, domain names, logos, product and service names, designs, and slogans, as well as the Service’s look and feel, including all page headers, custom graphics, button icons, and scripts are trademarks or trade dress of ours, our affiliates, or licensors. You must not use those marks in whole or in part in connection with any product or service that is not ours, in any manner that is likely to cause confusion among consumers, or in any manner that disparages or discredits us, without first obtaining our prior written permission. Any use of these marks must be under any guidelines that we may provide you from time to time. All other service marks, trademarks, trade names, logos, product and service names, designs, and slogans on this Service are the marks of their respective owners. Reference on the Service to any products, services, processes, or other information, by trade name, trademark, manufacturer, supplier, or otherwise does not constitute or imply our endorsement, sponsorship, or recommendation or any other affiliation.
We hereby grant you a limited, nonsublicensable license (i.e., a personal and limited right) to access and use the Service for your personal, noncommercial use only.
# Your Account
You are responsible for maintaining the confidentiality of account information and for restricting access to your account. You agree to accept responsibility and liability for all activities that occur under your account whether lawful or unlawful. You are also solely responsible for all uses of your account, whether or not actually or expressly authorized by you. Persons under the age of 18 years may use the Services ONLY with involvement of a parent or guardian.
Mentor & Match Corporation reserves the right to refuse use of the Services, terminate accounts, or cancel orders in our sole discretion. Violation of this Agreement may result in immediate suspension of your account. In order to ensure that Mentor & Match Corporation is able to provide high quality services that are responsive to your needs, you agree to allow our employees to access your account and records on a case-by-case basis to investigate complaints. We will not disclose the existence or occurrence of such an investigation unless required by law, including but not limited to a court order or an order of any other administrative or regulatory agency.
# Account Registration
Mentor & Match Corporation allows for our Website to be used as a "Visitor" (a general user of our Website where no registration is required) or as a "Member" (you have registered with our Website and obtained a subscription for our Services).By using our Website as a Visitor, you represent that you are of legal age to acquire the goods/services you are seeking through our Website.
By registering as a Member, you are legally representing that your registration information is truthful, accurate, and complete. You understand that, by registering as a Member, personally identifiable information may be collected by Mentor & Match Corporation and that such information may be used consistent with Mentor & Match Corporation's Privacy Policy.
For Members, a user name and password will be assigned by us or chosen by you. You understand and agree that you are responsible for maintaining the secrecy of your password and for activities occurring under your account. You should change your password promptly and notify us immediately if you believe that others are accessing your account. You understand and agree that you will not transfer or loan your username and password to others, or allow others to use your username and password in a manner that is inconsistent with this Agreement. You must not sell, rent, lease, share, or provide access to your account to anyone else, including charging anyone for access to administrative rights on your account. We may disable any username, password, or other identifier, whether chosen by you or provided by us, at any time in our sole discretion for any reason or no reason, including if, in our opinion, you have breached any part of this agreement. You cannot use our Services until after we have verified the email address you provide during registration.
We care about the integrity and security of your personal information. But we cannot guarantee that unauthorized persons will never be able to defeat the Service’s security measures or use any personal information you provide to us for improper purposes. You acknowledge that you provide your personal information at your own risk. We will not be liable for any loss that you may incur because of someone else using your password or account, either with or without your knowledge. You could be held liable for losses incurred by us or another person because of someone else using your password or account.
# No Liability For Access By Minors
The Website is not designed or intended to attract children under the age of 17. Mentor & Match Corporation is not responsible for determining the age of its users and has no liability whatsoever should an unpermitted minor access our Website. We do not collect any personally identifiable information, whether or not such information is voluntarily provided, from any person we actually know is under the age of 13. If we are made aware that we have actually collected information about a person under the age of 13, we will remove that information from our records in a timely fashion.
# Free Trial Accounts
Mentor & Match Corporation may offer Free Trial accounts where you can use Mentor & Match Corporation’s Services free of charge for a specified time period. Upon expiration of this time period, your access to our Services will be terminated unless you choose to become a paying Member. You understand that only a single Free Trial account will be granted for a given email address. Mentor & Match Corporation has no duty to provide Free Trial accounts and has no liability to you if you cannot obtain one or if we terminate your Free Trial account prior to the expiration of the given time period of your existing Free Trial account. At any time, Mentor & Match may discontinue offering Free Trial accounts without notice or liability to you at our sole discretion.
# Termination of Account
You may terminate your account with Mentor & Match Corporation at any time; however, you are not entitled to a refund of any amounts paid by you for your membership. We may terminate your account without notice or refund to you in our sole discretion, including but not limited to, if you violate this Agreement or any other guidelines or rules posted by Mentor & Match Corporation, and with no liability to Mentor & Match Corporation. If your account is terminated, Mentor & Match Corporation reserves the right to remove your account information along with any software settings from our servers with NO liability or notice to you. On termination of this Agreement, any provision which, by its nature or express terms should survive, will survive the termination of this Agreement.
${COMMUNICATIONS}
Mentor & Match Corporation’s Website and/or Services may display, include or make available content, data, factual information, applications, including but not limited to third party applications, software, viruses, or materials from third parties ("Third Party Materials"). Such Third-Party Materials are provided solely as a convenience to you. You acknowledge and agree that Mentor & Match Corporation is not responsible for examining or evaluating the content, accuracy, completeness, timeliness, validity, copyright compliance, legality, decency, quality or any other aspect of such Third Party Materials. Mentor & Match Corporation does not warrant or endorse and does not assume and will not have any liability or responsibility to you or any other person for any Services, Third Party Materials, or for any other materials, products, or services of third parties. Although we provide rules for user conduct and postings, we do not control nor are not responsible for what users post, transmit or share on our Website. Furthermore, we are not responsible for any offensive, inappropriate, obscene, unlawful or otherwise objectionable content you may encounter on our Website. Mentor & Match Corporation is not responsible for the conduct, whether online or offline, of any user of the Website or Services.
Mentor & Match Corporation may be temporarily unavailable from time to time for maintenance or other reasons. Mentor & Match Corporation assumes no responsibility for any error, omission, interruption, deletion, defect, delay in operation or transmission, communications line failure, theft or destruction or unauthorized access to, or alteration of, user communications. Mentor & Match Corporation is not responsible for any technical malfunction in your use of our Website, including, but not limited to, problems with using the Website and/or Services, loss of personal content on our Website, and lost or undeliverable email. Under no circumstances will Mentor & Match Corporation be responsible for any loss or damage, including, but not limited to personal injury or death, resulting from use of our Website or Services, or any interactions between users of our Website, whether online or offline.
# Waiver of Liability for Links to Other Websites
Our Website may contain links to other websites ("Third Party Websites"). You understand and agree that Mentor & Match Corporation has no control over the content of Third Party Websites, especially with regards to the accuracy, reliability, and timeliness of their content. You understand and agree that your use and reliance on any content from Third Party Websites is solely at your own risk. You understand and agree that Mentor & Match Corporation is in no way liable for any damages to you that may arise from such use or reliance, regardless of the fact that you reached one or more Third Party Websites through our Website.
# Monitoring and Removal of Information
You understand and agree that Mentor & Match Corporation reserves the right, but is under no obligation, to monitor all advertisements, public postings and messages to ensure that they conform to our content guidelines. We also reserve the right to monitor all messages that take place through our Website. You understand and agree that monitoring is at our discretion and that we cannot and do not monitor every message or other material posted or sent by Members of our Website. You understand and agree that Mentor & Match Corporation is not responsible in any way for monitoring or failing to monitor any offensive or obscene materials that may be transmitted or posted by other users, including, but not limited to, current members, unauthorized users, hackers, etc. Furthermore, you also understand and agree that Mentor & Match Corporation is not responsible for the use of any personal information that a member may choose to post on our Website. Mentor & Match Corporation reserves the right to delete, move, or edit messages or materials, including, but not limited to, advertisements, public postings, and messages that we, in our sole discretion, deem necessary to be removed.
# Promotional Lists and Newsletters
You understand and agree that by using our Website and/or Services, your name may be placed on promotional lists to receive emails regarding our Website and Services, news from our affiliates, and the Mentor & Match Corporation newsletter. If at anytime you no longer wish to receive such emails, please visit the "Account Settings" section of our Website. Mentor & Match Corporation complies with all provisions of the CAN-SPAM Act.
# Advertisers, User Contributions, Testimonials and Opinions
You understand that our Website and any newsletters or emails you receive from Mentor & Match Corporation or our affiliates may include advertisements, user-contributed materials (such as blogs or discussion groups), testimonials and opinions from other individuals, including, but not limited to, users of our Website, manufacturers and service providers, and other industry professionals. You understand and agree that such advertisements, user-contributed materials, testimonials, and opinions are considered those of the individual that gave them and in no way represent a warranty of our Website and/or Services. Furthermore, you understand and agree that Mentor & Match Corporation is no way liable for the content and your reliance on it of any such advertisements, user-contributed materials, testimonials, and opinions.
${conductRules('"stalk"')}
# App Stores
You acknowledge and agree that the availability of the Service is dependent on the third party from whom you received the Service license and related software (the “App-Enabled Software”), e.g., the Apple App Store or Google Play (each, an “App Store”). In order to use the Service, you must have access to a wireless network, and you agree to pay all fees associated with such access. You also agree to pay all fees (if any) charged by the App Store in connection with Service.
You agree to comply with, and your license to use the Service is conditioned upon your compliance with all terms of agreement imposed by the applicable App Store when using any Service. Accordingly, you acknowledge and agree as follows:
This Agreement is between you and us and not with the App Store. As between us and the App Store, we, and not the App Store, are solely responsible for the Service and the content thereof.
The license granted to you for use of the App-Enabled Software is limited to a non-transferable license to use the Service on any Apple or Google-branded products that you own or control and as permitted by the usage rules set forth in the relevant App Store Terms of Service, except that such Service may be accessed, acquired, and used by other accounts associated with you via Family Sharing or volume purchasing.
As between us and the App Store, we, and not the App Store, are solely responsible for and maintenance and support services with respect to the Service (as specified in this Agreement, or as required under applicable law).
As between us and the App Store, we, and not the App Store, are solely responsible the warranty on the Service (whether express or implied) therefor. In the event of any failure of the Service to conform to any applicable warranty, you may notify the App Store, and the App Store will refund the purchase price, if any, for the App-Enabled Software to you; and that, to the maximum extent permitted by applicable law, the App Store will have no other warranty obligation whatsoever with respect to the Service, and any other claims, losses, liabilities, damages, costs or expenses attributable to any failure to conform to any warranty, if any, will be the sole responsibility of us.
As between us and the App Store, we, and not the App Store, are solely responsible for addressing any claims relating to the Service (e.g., product liability, legal compliance or intellectual property infringement).
As between us and the App Store, we, and not the App Store, are responsible for addressing any claims of you or any third party relating to the App-Enabled Software or your possession and/or use of that App-Enabled Software, including, but not limited to: (i) product liability claims; (ii) any claim that the App-Enabled Software fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection or similar legislation.
In the event of any third party claim that the App-Enabled Software or your or any other the end-user's possession and use of that App-Enabled Software infringes that third party's intellectual property rights, as between us and the App Store, we, and not the App Store, will be solely responsible for the investigation, defense, settlement and discharge of any such intellectual property infringement claim.
You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a “terrorist supporting” country; (ii) you are not listed on any U.S. Government list of prohibited or restricted parties; and (iii) you are not located in any other country or jurisdiction from which you would be barred from using the Service by applicable law.
If you have any questions, complaints or claims with respect to the App-Enabled Software, they should be directed to us as follows:
support@mentorandmatch.com 2785 Pacific Coast Highway #171 Torrance CA 90505 (310) 435-8447
You may not use the Service or the App-Enabled Software in any manner in violation of or inconsistent with the usage rules for App-Enabled Software in, or otherwise be in conflict with, the App Store Terms of Service or any other applicable third-party terms and conditions.
You acknowledge that the App Store (and its affiliates) are third-party beneficiaries of this Agreement and that, upon your acceptance of the terms and conditions of this Agreement, the App Store will have the right (and will be deemed to have accepted the right) to enforce this Agreement against you with respect to the App-Enabled Software as a third-party beneficiary thereof. We may amend, terminate or rescind this Agreement without the consent of the App Stores or any such subsidiary.
To the extent you access the Service through a mobile device, your wireless service carrier's standard charges, data rates and other fees may apply, and you are solely responsible for such charges and fees.
# Disclaimer of Warranties and Limitation of Liability; Indemnification
Unless we otherwise agree in writing, this website and the services are provided on an "as is" and "as available" basis, without warranty of any kind. to the maximum extent permitted by law, mentor & match corporation expressly disclaims all warranties, whether express, implied, or statutory, regarding the website and services, including, but not limited to, the implied warranties of title, merchantability, fitness for a particular purpose, and non-infringement. mentor & match corporation does not represent or warrant that the services will be error free, secure, virus free, or without interruption.
Neither of us will be liable to the other for any consequential, incidental, indirect, special, or exemplary damages of any kind, including without limitation any loss of use, loss of business, or loss of profit or revenue, arising out of or in connection with services provided by us (however arising, including negligence), even if we are aware of the possibility of such damages. mentor & match corporation’s total cumulative liability in connection with the services rendered, whether in contract or tort or otherwise, will not exceed any amounts paid by you for services rendered during the twelve (12) month period immediately preceding the date on which such liability arose.
You agree to indemnify, defend and hold harmless mentor & match corporation, its affiliates, officers, directors, employees, consultants and agents from and against any and all third party claims, losses, liability, damages and/or costs (including, but not limited to, attorney’s fees) directly or indirectly arising out of or relating to your use of, or conduct on, mentor & match's website or services, your violation or breach of this Agreement, your infringement, or infringement by any other user of your account, of any intellectual property or other right of any person or entity, your dispute with any other user, your violation of law or the rights of any person, including publicity, and privacy rights. Our rights under this section do not affect other rights we might have.
If you are dissatisfied with the Service or have any other complaint, your exclusive remedy is to terminate your account (if you have one) and stop using the Service.
waiver of California Civil Code Section 1542—California Residents Only. With respect to the releases of liability set out in this agreement, you acknowledge that you understand the consequences of entering into the general release and discharge of all known and unknown claims as stated in this agreement and that you are familiar with the provisions of section 1542 of the California Civil Code, which provides that: A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party. You waive all rights under section 1542 and any other federal or state statutes or laws of similar effect.
This Agreement will be binding upon, and will inure to the benefit of, your and mentor & match ’s successors, assigns, and licensees.
# Application Law
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without giving effect to its conflict of laws doctrine or to the conflict of laws doctrine of your actual state or country of residence.
Each party waives its right to a jury trial in proceedings arising out of or relating to this Agreement. All claims must be brought in the parties’ individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding, and, unless we agree otherwise, the court will not consolidate more than one person’s claims. Both parties acknowledge that each party is waiving the right to participate in a class action. You will not file a claim arising out of or relating to the Service or this agreement more than one year after the cause of action arose. Any claim brought after one year is barred.
Both you and Mentor & Match Corporation unconditionally agree to assert any claims against the other arising out of or relating to the Website, Services, or this Agreement in the form of a lawsuit commenced in Los Angeles, CA or the United States District Court in and for the district in which such county is located. You hereby consent to the sole and exclusive jurisdiction and venue of the courts of that county, state, and district for such purposes.
# Modification and Waiver
We reserve the right to make changes to the Website, our Services, this Agreement and applicable policies and guidelines at any time. A waiver by Mentor & Match Corporation of its rights hereunder will not be binding unless contained in a writing signed by an authorized representative of Mentor & Match Corporation. Mentor & Match Corporation's non-enforcement or waiver of any provision on one (1) occasion does not constitute a waiver of such provision on any other occasions unless expressly so agreed in writing.
# Severability
If any condition of this Agreement is deemed invalid, void, or unenforceable for any reason, that condition will be severed from this Agreement and will not affect the validity and enforceability of any remaining condition.
# Questions
If you have any questions regarding this Agreement, please contact us at:
Mentor & Match Corporation 2785 Pacific Coast Highway #171 Torrance CA 90505
California Residents Only. You may contact in writing the Complaint Assistance Unit of the Division of Consumer Services of the Department of Consumer Affairs at 1020 North Street, #501, Sacramento, California 95814, or by telephone at 1 (916) 445-1254.`;

const CONFIDENTIALITY = `# Your Family Education Rights And Privacy Act (FERPA) Rights
${FERPA}
# Important Information (Security)
${SECURITY}`;

const EDUCATIONAL = `# Disclaimer of Warranties and Limitation of Liability; Indemnification
Unless we otherwise agree in writing, this website and the services are provided on an “as is” and “as available” basis, without warranty of any kind. to the maximum extent permitted by law, Mentor & Match corporation expressly disclaims all warranties, whether express, implied, or statutory, regarding the website and services, including, but not limited to, the implied warranties of title, merchantability, fitness for a particular purpose, and non-infringement. Mentor & Match Corporation does not represent or warrant that the services will be error free, secure, virus free, or without interruption.
Neither of us will be liable to the other for any consequential, incidental, indirect, special, or exemplary damages of any kind, including without limitation any loss of use, loss of business, or loss of profit or revenue, arising out of or in connection with services provided by us (however arising, including negligence), even if we are aware of the possibility of such damages. Mentor & Match corporation’s total cumulative liability in connection with the services rendered, whether in contract or tort or otherwise, will not exceed any amounts paid by you for services rendered during the twelve (12) month period immediately preceding the date on which such liability arose.
You agree to indemnify, defend and hold harmless Mentor & Match Corporation, its affiliates, officers, directors, employees, consultants and agents from and against any and all third party claims, losses, liability, damages and/or costs (including, but not limited to, attorney’s fees) directly or indirectly arising out of or relating to your use of, or conduct on, Mentor & Match’s website or services, your violation or breach of this Agreement, your infringement, or infringement by any other user of your account, of any intellectual property or other right of any person or entity, your dispute with any other user, your violation of law or the rights of any person, including publicity, and privacy rights. Our rights under this section do not affect other rights we might have.
If you are dissatisfied with the Service or have any other complaint, your exclusive remedy is to terminate your account (if you have one) and stop using the Service.
Waiver of California Civil Code Section 1542—California Residents Only. With respect to the releases of liability set out in this agreement, you acknowledge that you understand the consequences of entering into the general release and discharge of all known and unknown claims as stated in this agreement and that you are familiar with the provisions of section 1542 of the California Civil Code, which provides that: A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party. You waive all rights under section 1542 and any other federal or state statutes or laws of similar effect. This Agreement will be binding upon, and will inure to the benefit of, your and Mentor & Match ’s successors, assigns, and licensees.
# Application Law
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without giving effect to its conflict of laws doctrine or to the conflict of laws doctrine of your actual state or country of residence.
Each party waives its right to a jury trial in proceedings arising out of or relating to this Agreement. All claims must be brought in the parties’ individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding, and, unless we agree otherwise, the court will not consolidate more than one person’s claims. Both parties acknowledge that each party is waiving the right to participate in a class action. You will not file a claim arising out of or relating to the Service or this agreement more than one year after the cause of action arose. Any claim brought after one year is barred. Both you and Mentor & Match Corporation unconditionally agree to assert any claims against the other arising out of or relating to the Website, Services, or this Agreement in the form of a lawsuit commenced in Los Angeles, CA or the United States District Court in and for the district in which such county is located. You hereby consent to the sole and exclusive jurisdiction and venue of the courts of that county, state, and district for such purposes.
${COMMUNICATIONS}
# No Liability for Access by Minors
The Website and mobile application are not designed or intended to attract children under the age of 17. Mentor & Match Corporation is not responsible for determining the age of its users and has no liability whatsoever should an unpermitted minor access our Website. We do not collect any personally identifiable information, whether or not such information is voluntarily provided, from any person we actually know is under the age of 13. If we are made aware that we have actually collected information about a person under the age of 13, we will remove that information from our records in a timely fashion.
${conductRules('“stalk”')}`;

export type PolicyKey = 'code-of-conduct' | 'privacy' | 'terms' | 'confidentiality' | 'educational' | 'disclaimer';

export const POLICIES: Record<PolicyKey, { title: string; body: string }> = {
  'code-of-conduct': { title: 'Student Code of Conduct', body: CODE_OF_CONDUCT },
  privacy: { title: 'Privacy Policy', body: PRIVACY },
  terms: { title: 'Terms of Service', body: TERMS },
  confidentiality: { title: 'Confidentiality', body: CONFIDENTIALITY },
  educational: { title: 'Education Purposes Only Confirmation', body: EDUCATIONAL },
  disclaimer: {
    title: 'Disclaimer',
    body: 'Mentor & Match Corporation is not affiliated with referred third-party companies. All referrals to third-party services, including those provided through our mobile application, are for convenience only.',
  },
};

export type Block = { kind: 'h' | 'sub' | 'p' | 'ul'; text: string[] };

/** Turns the policy markup above into blocks, grouping consecutive bullets into one list. */
export function parsePolicy(body: string): Block[] {
  const out: Block[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) out.push({ kind: 'sub', text: [line.slice(3)] });
    else if (line.startsWith('# ')) out.push({ kind: 'h', text: [line.slice(2)] });
    else if (line.startsWith('- ')) {
      const last = out[out.length - 1];
      if (last?.kind === 'ul') last.text.push(line.slice(2));
      else out.push({ kind: 'ul', text: [line.slice(2)] });
    } else out.push({ kind: 'p', text: [line] });
  }
  return out;
}
