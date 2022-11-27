# Frappe Alerts

A small **Frappe** module that displays custom alerts to specific recipients after login.

<div style="width:100%;text-align:center">
    <img src="https://github.com/kid1194/frappe_alerts/blob/main/images/notice-alert-mobile.png?raw=true" alt="Alerts"/>
</div>
<div style="width:100%;text-align:center">
    <img src="https://github.com/kid1194/frappe_alerts/blob/main/images/warning-alert-mobile.png?raw=true" alt="Alerts"/>
</div>
<div style="width:100%;text-align:center">
    <img src="https://github.com/kid1194/frappe_alerts/blob/main/images/urgent-alert-mobile.png?raw=true" alt="Alerts"/>
</div>

---

### Table of Contents
- [Requirements](#requirements)
- [Setup](#setup)
  - [Install](#install)
  - [Update](#update)
  - [Uninstall](#uninstall)
- [Usage](#usage)
- [Issues](#issues)
- [License](#license)

---

### Requirements
- Frappe >= v12.0.0

---

### Setup

⚠️ *Important* ⚠️

*Do not forget to replace [sitename] with the name of your site in all commands.*

#### Install
1. Go to bench directory

```
cd ~/frappe-bench
```

2. Get plugin from Github

*(Required only once)*

```
bench get-app https://github.com/kid1194/frappe_alerts
```

3. Build plugin

*(Required only once)*

```
bench build --app alerts
```

4. Install plugin on a specific site

```
bench --site [sitename] install-app alerts
```

5. Check the [usage](#usage) section

#### Update
1. Go to app directory

```
cd ~/frappe-bench/apps/alerts
```

2. Get updates from Github

```
git pull
```

3. Go to bench directory

```
cd ~/frappe-bench
```

4. Build plugin

```
bench build --app alerts
```

5. Update a specific site

```
bench --site [sitename] migrate
```

6. (Optional) Restart bench

```
bench restart
```

#### Uninstall
1. Go to bench directory

```
cd ~/frappe-bench
```

2. Uninstall plugin from a specific site

```
bench --site [sitename] uninstall-app alerts
```

3. Remove plugin from bench

```
bench remove-app alerts
```

4. (Optional) Restart bench

```
bench restart
```

---

### Usage


---

### Issues
If you find bug in the plugin, please create a [bug report](https://github.com/kid1194/frappe_alerts/issues/new?assignees=kid1194&labels=bug&template=bug_report.md&title=%5BBUG%5D) and let us know about it.

---

### License
This repository has been released under the [MIT License](https://github.com/kid1194/frappe_alerts/blob/main/LICENSE).
