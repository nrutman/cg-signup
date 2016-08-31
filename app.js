(function() {

    angular
        // module definition
        .module('prov.cgSignup', ['ngAnimate', 'ngMessages', 'ngMaterial', 'ui.mask'])
        // constants
        .constant('MAX_MEMBERS', 12)
        // configuration
        .config(MdThemeConfig)
        // filters
        .filter('time', TimeFilter)
        // services
        .service('apiService', ApiService)
        .service('groupService', GroupService)
        .service('signupService', SignupService)
        // controllers
        .controller('ConfirmationModalCtrl', ConfirmationModalCtrl)
        .controller('SignupCtrl', SignupCtrl)
        // run block
        .run(AppRun);

    function MdThemeConfig($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('orange');
    }

    /**
     * @ngdoc Service
     * @name ApiService
     * @description Handles logic to communicate with API
     * @requires $http
     */
    function ApiService($http) {
        var self = this;
        self.request = request;

        function request(method, object, data) {
            var config = {
                method: method,
                url: '/api.php?object=' + object
            };

            if (data) {
                config.data = data;
            }

            return $http(config);
        }
    }

    /**
     * @ngdoc Controller
     * @name ConfirmationModalCtrl
     * @description Controller for the group selection confirmation modal
     */
    function ConfirmationModalCtrl($mdDialog) {
        var self = this;
        self.complete = complete;
        self.data = {
            firstPreference: true,
            preferenceNotes: '',
            notes: ''
        };
        self.groups = self.groups || [];
        self.selectedGroup = self.selectedGroup || {};

        function complete() {
            $mdDialog.hide();
        }
    }

    /**
     * @ngdoc Service
     * @name GroupService
     * @description Logic for fetching and storing groups
     * @requires apiService
     */
    function GroupService(apiService) {
        var self = this;
        self.fetch = fetch;

        var groups = [];

        function fetch() {
            return apiService.request('GET', 'groups')
            .then(function(response) {
                return response.data;
            });
        }
    }

    /**
     * @ngdoc Service
     * @name SignupService
     * @description Logic for fetching and storing signups
     * @requires apiService
     */
    function SignupService(apiService) {
        var self = this;
        self.fetch = fetch;
        self.create = create;

        var signups = [];

        function create(signup) {
            return apiService.request('POST', 'signup', signup);
        }

        function fetch() {
            return apiService.request('GET', 'signups')
                .then(function(response) {
                    return response.data;
                });
        }
    }


    /**
     * @ngdoc Controller
     * @name signupCtrl
     * @description Controller for the main sign-up page
     * @requires $mdDialog
     * @requires $q
     * @requires groupService
     * @requires signupService
     */
    function SignupCtrl($mdDialog, $q, groupService, signupService, MAX_MEMBERS) {
        var self = this;
        self.getContainerClass = getContainerClass;
        self.currentStep = 1;
        self.data = {};
        self.getFormattedGroupType = getFormattedGroupType;
        self.getGroupClasses = getGroupClasses;
        self.getGroupCountLanguage = getGroupCountLanguage;
        self.getGroupEmptyCount = getGroupEmptyCount;
        self.groups = [];
        self.joinGroup = joinGroup;
        self.next = next;
        self.previous = previous;
        self.totalSteps = 4;

        var validationMethods = [angular.noop, validateStep2, validateStep3];
        var groupMapByName;
        var groupMapById;

        initialize();

        function initialize() {
            // reset collections
            self.groups = [];
            groupMapById = {};
            groupMapByName = {};

            // query for data
            $q.all({
                groups: groupService.fetch(),
                signups: signupService.fetch()
            })
                .then(function(results) {
                    processGroups(results.groups, results.signups);
                });
        }

        function getContainerClass() {
            var containerClasses = ['s', 's', 'l', 's'];
            return containerClasses[self.currentStep - 1];
        }

        function getFormattedGroupType(name) {
            if (name.indexOf('Famil') > -1) {
                return name;
            }
            return name + ' Group';
        }

        function getGroupClasses(group) {
            classes = ['group'];

            if (group.members.length >= MAX_MEMBERS) {
                classes.push('group-closed');
            } else {
                classes.push('group-open');
            }

            return classes;
        }

        function getGroupCountLanguage(count) {
            if (count === 0) {
                return 'This group is empty. Be the first to sign up!';
            }
            if (count === 1) {
                return '1 person has signed up for this group';
            }

            return count + ' people have signed up for this group';
        }

        function getGroupEmptyCount(groupName) {
            var group = null;

            for (i=0; i<self.groups.length; i++) {
                if (self.groups[i].name === groupName) {
                    group = self.groups[i];
                    break;
                }
            }

            if (group === null) return new Array(0);

            return new Array(MAX_MEMBERS - group.members.length);
        }

        function joinGroup(groupId) {
            var newSignup = {
                group_id: groupId,
                first_name: self.data.firstName,
                last_name: self.data.lastName,
                email: self.data.email,
                phone: self.data.phone
            };
            signupService.create(newSignup).then(function() {
                $mdDialog.show({
                    bindToController: true,
                    controller: 'ConfirmationModalCtrl as ctrl',
                    escapeToClose: false,
                    locals: {
                        groups: self.groups,
                        selectedGroup: self.groups[groupMapById[groupId]]
                    },
                    templateUrl: 'app/templates/modals/confirmationModal.tpl.html'
                }).then(submitFeedback);
            });
        }

        function previous() {
            self.currentStep = Math.max(self.currentStep - 1, 1);
        }

        function processGroups(groupData, signupData) {

            angular.forEach(groupData, function(group, i) {
                group.members = [];
                groupMapByName[group.name] = i;
                groupMapById[group.id] = i;
                self.groups.push(group);
            });

            angular.forEach(signupData, function(signup, i) {
                signup.full_name = [signup.first_name, signup.last_name].join(' ');
                self.groups[groupMapByName[signup.group_name]].members.push(signup);
            });

        }

        function next() {
            if (!validationMethods[self.currentStep - 1]()) {
                self.currentStep = Math.min(self.currentStep + 1, self.totalSteps);
            }
        }

        function submitFeedback() {
            //
            // TODO: Post the updated response
            //
            self.currentStep++;
        }

        function validateStep2() {
            return self.aboutForm.$invalid;
        }

        function validateStep3() {}
    }

    function TimeFilter($filter) {
        return function(input) {
            var pieces = input.split(':');
            var pieceTypes = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'];
            var dateTime = new Date();
            for (var i=0; i<pieceTypes.length; i++) {
                var value = (pieces.length >= i + 1) ? pieces[i] : 0;
                dateTime['set' + pieceTypes[i]](value);
            }
            return $filter('date')(dateTime, 'shortTime');
        };
    }

    /**
     * App Run Block
     */
    function AppRun(groupService, signupService) {}

})();
